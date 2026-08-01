package domain

import "time"

// ItemVariant represents a specific size/version of a product
type ItemVariant struct {
	ID              uint       `json:"id" gorm:"primaryKey"`
	ProductID       uint       `json:"productId"`
	SKU             string     `json:"sku" gorm:"unique"`
	Sizing          string     `json:"sizing"` // e.g., '1kg', '3kg', 'Large', 'Small'
	CurrentStock    int        `json:"currentStock"`
	MinStock        int        `json:"minStock"` // low-stock alert threshold
	Unit            string     `json:"unit"`     // e.g., 'kg', 'unidad', 'ml'
	ExpirationDate  *time.Time `json:"expirationDate"`
	PrimarySupplier string     `json:"primarySupplier"`
	Price           float64    `json:"price"`     // selling price, ex-IVA
	CostPrice       float64    `json:"costPrice"` // last purchase cost, ex-IVA
	VatRate         float64    `json:"vatRate"`   // IVA %: 19, 5, 0

	// Quotes carries the provider prices typed in the product form. Transient
	// (gorm:"-"): written through SaveProviderPrice once the variant has an ID,
	// never as an association, so FullSaveAssociations can't rewrite quotes.
	Quotes []ProviderPrice `json:"quotes" gorm:"-"`
}
