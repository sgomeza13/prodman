package repository

import (
	domain "prodman/internal/core/domain/model"
)

type ProductRepository interface {
	Create(product *domain.Product) error
	GetByID(id uint) (*domain.Product, error)
	GetAll() ([]domain.Product, error)
	Update(product *domain.Product) error
	Delete(id uint) error
	UpdateProductImage(id uint, path string) error

	// Variants
	CreateVariant(variant *domain.ItemVariant) error
	UpdateVariant(variant *domain.ItemVariant) error
	DeleteVariant(id uint) error

	// Brands
	CreateBrand(brand *domain.Brand) error
	GetAllBrands() ([]domain.Brand, error)
	UpdateBrand(brand *domain.Brand) error
	DeleteBrand(id uint) error

	// Categories
	CreateCategory(category *domain.Category) error
	GetAllCategories() ([]domain.Category, error)
	UpdateCategory(category *domain.Category) error
	DeleteCategory(id uint) error

	// Providers
	CreateProvider(provider *domain.Provider) error
	GetAllProviders() ([]domain.Provider, error)
	UpdateProvider(provider *domain.Provider) error
	DeleteProvider(id uint) error

	// Provider prices (manual quotes, ex-IVA)
	SaveProviderPrice(pp *domain.ProviderPrice) error
	DeleteProviderPrice(id uint) error
	GetProviderPrices(productID uint) ([]domain.ProviderPrice, error)

	// Settings
	GetSettings() (map[string]string, error)
	SaveSettings(settings map[string]string) error

	// Purchases
	CreatePurchase(purchase *domain.Purchase, acceptedPrice float64) error
	GetPurchases(limit int) ([]domain.Purchase, error)

	// Sales
	CreateSale(sale *domain.Sale) error
	GetSales(limit int) ([]domain.Sale, error)
	GetSalesReport(periodFmt string, limit int) ([]domain.ReportRow, error)
}
