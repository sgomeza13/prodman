package domain

import "time"

// Provider is a supplier the store buys from
type Provider struct {
	ID          uint   `json:"id" gorm:"primaryKey"`
	Name        string `json:"name" gorm:"unique"`
	Phone       string `json:"phone"`
	Description string `json:"description"`
}

// ProviderPrice is a manually maintained purchase quote, ex-IVA. Deliberately
// NOT referenced from Product/ItemVariant so productRepository.Update's
// FullSaveAssociations can never rewrite quotes on a product save.
type ProviderPrice struct {
	ID            uint      `json:"id" gorm:"primaryKey"`
	ProviderID    uint      `json:"providerId"`
	ItemVariantID uint      `json:"itemVariantId"`
	Price         float64   `json:"price"` // ex-IVA
	UpdatedAt     time.Time `json:"updatedAt"`
	Provider      *Provider `json:"provider"` // read-only preload
}
