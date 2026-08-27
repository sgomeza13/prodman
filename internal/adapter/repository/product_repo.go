package repository

import (
	"fmt"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	domain "prodman/internal/core/domain/model"
	"prodman/internal/core/port/repository"
)

type productRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) repository.ProductRepository {
	return &productRepository{
		db: db,
	}
}

func (r *productRepository) Create(product *domain.Product) error {
	return r.db.Omit("Brand", "Category").Create(product).Error
}

func (r *productRepository) GetByID(id uint) (*domain.Product, error) {
	var product domain.Product
	err := r.db.Preload("Variants").Preload("Brand").Preload("Category").First(&product, id).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) GetAll() ([]domain.Product, error) {
	var products []domain.Product
	err := r.db.Preload("Variants").Preload("Brand").Preload("Category").Find(&products).Error
	return products, err
}

func (r *productRepository) Update(product *domain.Product) error {
	// Vencimiento is written by the purchase path alone (docs/adr/0001), so the
	// product form has no say in it: re-stamp the stored dates onto the payload
	// before FullSaveAssociations writes the variant rows. Without this, any
	// product edit — a rename — nulls every expiry date the purchases set.
	stored, err := r.variantExpiryDates(product.ID)
	if err != nil {
		return err
	}
	for i := range product.Variants {
		// a brand new variant has ID 0 and no stored date: nil, as it should be
		product.Variants[i].ExpirationDate = stored[product.Variants[i].ID]
	}

	// FullSaveAssociations so existing variants get updated, new ones created;
	// Omit Brand/Category so a stale preloaded pointer can't overwrite those rows
	return r.db.Session(&gorm.Session{FullSaveAssociations: true}).
		Omit("Brand", "Category").Save(product).Error
}

func (r *productRepository) variantExpiryDates(productID uint) (map[uint]*time.Time, error) {
	var rows []domain.ItemVariant
	err := r.db.Select("id", "expiration_date").Where("product_id = ?", productID).Find(&rows).Error
	if err != nil {
		return nil, err
	}
	dates := make(map[uint]*time.Time, len(rows))
	for _, v := range rows {
		dates[v.ID] = v.ExpirationDate
	}
	return dates, nil
}

func (r *productRepository) Delete(id uint) error {
	// old schema has no ON DELETE CASCADE, so cascade manually
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("product_id = ?", id).Delete(&domain.ItemVariant{}).Error; err != nil {
			return err
		}
		return tx.Delete(&domain.Product{}, id).Error
	})
}

func (r *productRepository) UpdateProductImage(id uint, path string) error {
	return r.db.Model(&domain.Product{}).Where("id = ?", id).Update("image_path", path).Error
}

func (r *productRepository) CreateVariant(variant *domain.ItemVariant) error {
	return r.db.Create(variant).Error
}

func (r *productRepository) UpdateVariant(variant *domain.ItemVariant) error {
	return r.db.Save(variant).Error
}

func (r *productRepository) DeleteVariant(id uint) error {
	return r.db.Delete(&domain.ItemVariant{}, id).Error
}

func (r *productRepository) CreateBrand(brand *domain.Brand) error {
	return r.db.Create(brand).Error
}

func (r *productRepository) GetAllBrands() ([]domain.Brand, error) {
	var brands []domain.Brand
	err := r.db.Find(&brands).Error
	return brands, err
}

func (r *productRepository) UpdateBrand(brand *domain.Brand) error {
	return r.db.Save(brand).Error
}

func (r *productRepository) DeleteBrand(id uint) error {
	return r.db.Delete(&domain.Brand{}, id).Error
}

func (r *productRepository) CreateCategory(category *domain.Category) error {
	return r.db.Create(category).Error
}

func (r *productRepository) GetAllCategories() ([]domain.Category, error) {
	var categories []domain.Category
	err := r.db.Find(&categories).Error
	return categories, err
}

func (r *productRepository) UpdateCategory(category *domain.Category) error {
	return r.db.Save(category).Error
}

func (r *productRepository) DeleteCategory(id uint) error {
	return r.db.Delete(&domain.Category{}, id).Error
}

func (r *productRepository) CreateProvider(provider *domain.Provider) error {
	return r.db.Create(provider).Error
}

func (r *productRepository) GetAllProviders() ([]domain.Provider, error) {
	var providers []domain.Provider
	err := r.db.Find(&providers).Error
	return providers, err
}

func (r *productRepository) UpdateProvider(provider *domain.Provider) error {
	return r.db.Save(provider).Error
}

func (r *productRepository) DeleteProvider(id uint) error {
	return r.db.Delete(&domain.Provider{}, id).Error
}

// upsertProviderPrice writes a quote on (provider_id, item_variant_id): saving
// again for the same provider+variant just overwrites the price.
func upsertProviderPrice(db *gorm.DB, pp *domain.ProviderPrice) error {
	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "provider_id"}, {Name: "item_variant_id"}},
		DoUpdates: clause.AssignmentColumns([]string{"price", "updated_at"}),
	}).Omit("Provider").Create(pp).Error
}

func (r *productRepository) SaveProviderPrice(pp *domain.ProviderPrice) error {
	return upsertProviderPrice(r.db, pp)
}

func (r *productRepository) DeleteProviderPrice(id uint) error {
	return r.db.Delete(&domain.ProviderPrice{}, id).Error
}

func (r *productRepository) GetProviderPrices(productID uint) ([]domain.ProviderPrice, error) {
	var prices []domain.ProviderPrice
	err := r.db.Preload("Provider").
		Joins("JOIN item_variants iv ON iv.id = provider_prices.item_variant_id").
		Where("iv.product_id = ?", productID).
		Find(&prices).Error
	return prices, err
}

func (r *productRepository) GetSettings() (map[string]string, error) {
	var rows []domain.Setting
	if err := r.db.Find(&rows).Error; err != nil {
		return nil, err
	}
	settings := make(map[string]string, len(rows))
	for _, s := range rows {
		settings[s.Key] = s.Value
	}
	return settings, nil
}

func (r *productRepository) SaveSettings(settings map[string]string) error {
	rows := make([]domain.Setting, 0, len(settings))
	for k, v := range settings {
		rows = append(rows, domain.Setting{Key: k, Value: v})
	}
	if len(rows) == 0 {
		return nil
	}
	return r.db.Clauses(clause.OnConflict{UpdateAll: true}).Create(&rows).Error
}

// CreatePurchase records the stock entry and, in the same transaction, adds the
// received quantity to stock, updates the variant's cost, stamps the batch's
// vencimiento onto the variant and — if acceptedPrice is set — applies the
// suggested selling price.
func (r *productRepository) CreatePurchase(purchase *domain.Purchase, acceptedPrice float64) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(purchase).Error; err != nil {
			return err
		}
		updates := map[string]interface{}{
			"current_stock": gorm.Expr("current_stock + ?", purchase.Quantity),
			"cost_price":    purchase.UnitCost,
		}
		if acceptedPrice > 0 {
			updates["price"] = acceptedPrice
		}
		// the batch being received defines the variant's vencimiento from now on;
		// nil means the operator said nothing, so the existing date stands
		if purchase.ClearExpiration {
			updates["expiration_date"] = nil
		} else if purchase.ExpirationDate != nil {
			updates["expiration_date"] = *purchase.ExpirationDate
		}
		res := tx.Model(&domain.ItemVariant{}).Where("id = ?", purchase.VariantID).Updates(updates)
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return fmt.Errorf("producto no encontrado: %s", purchase.Description)
		}
		// buying from a provider keeps that provider's quote current
		if purchase.ProviderID != nil && purchase.UnitCost > 0 {
			return upsertProviderPrice(tx, &domain.ProviderPrice{
				ProviderID:    *purchase.ProviderID,
				ItemVariantID: purchase.VariantID,
				Price:         purchase.UnitCost,
			})
		}
		return nil
	})
}

func (r *productRepository) GetPurchases(limit int) ([]domain.Purchase, error) {
	var purchases []domain.Purchase
	err := r.db.Order("id DESC").Limit(limit).Find(&purchases).Error
	return purchases, err
}

// CreateSale is the money path: deduct stock for every item and insert the sale
// atomically. The `current_stock >= ?` guard rejects insufficient stock without
// a read-then-write race; any failure rolls back the whole sale.
func (r *productRepository) CreateSale(sale *domain.Sale) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, item := range sale.Items {
			res := tx.Model(&domain.ItemVariant{}).
				Where("id = ? AND current_stock >= ?", item.VariantID, item.Quantity).
				UpdateColumn("current_stock", gorm.Expr("current_stock - ?", item.Quantity))
			if res.Error != nil {
				return res.Error
			}
			if res.RowsAffected == 0 {
				return fmt.Errorf("stock insuficiente: %s", item.Description)
			}
		}
		return tx.Create(sale).Error
	})
}

func (r *productRepository) GetSales(limit int) ([]domain.Sale, error) {
	var sales []domain.Sale
	err := r.db.Preload("Items").Order("id DESC").Limit(limit).Find(&sales).Error
	return sales, err
}

func (r *productRepository) GetSalesReport(periodFmt string, limit int) ([]domain.ReportRow, error) {
	var rows []domain.ReportRow
	err := r.db.Raw(`
		SELECT strftime(?, s.created_at, 'localtime') AS period,
		       SUM(si.quantity * si.unit_price)                   AS revenue,
		       SUM(si.quantity * (si.unit_price - si.cost_price)) AS profit
		FROM sale_items si
		JOIN sales s ON s.id = si.sale_id
		GROUP BY period
		ORDER BY period DESC
		LIMIT ?`, periodFmt, limit).Scan(&rows).Error
	return rows, err
}
