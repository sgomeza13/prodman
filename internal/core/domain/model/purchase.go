package domain

import "time"

// Purchase is one stock entry: quantity received for a variant at a unit cost (ex-IVA).
// Description snapshots "Product Sizing" so history survives product deletion.
type Purchase struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	VariantID   uint      `json:"variantId"`
	Description string    `json:"description"`
	Quantity    int       `json:"quantity"`
	UnitCost    float64   `json:"unitCost"`
	ProviderID  *uint     `json:"providerId"`
	CreatedAt   time.Time `json:"createdAt"`
}
