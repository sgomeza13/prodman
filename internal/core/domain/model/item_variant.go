package domain

import "time"

// ItemVariant represents a specific size/version of a product
type ItemVariant struct {
	ID              uint       `json:"id" gorm:"primaryKey"`
	ProductID       uint       `json:"productId"`
	SKU             string     `json:"sku" gorm:"unique"`
	Sizing          string     `json:"sizing"` // e.g., '1kg', '3kg', 'Large', 'Small'
	CurrentStock    int        `json:"currentStock"`
	ExpirationDate  *time.Time `json:"expirationDate"`
	PrimarySupplier string     `json:"primarySupplier"`
	Price           float64    `json:"price"`
}
