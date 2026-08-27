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

	// ExpirationDate is the vencimiento printed on the batch being received.
	// Transient (gorm:"-"): the purchase row is a cost record, the date belongs
	// to the variant. nil means "not stated" and leaves the variant's date alone.
	ExpirationDate *time.Time `json:"expirationDate" gorm:"-"`

	// ClearExpiration marks the goods as non-perishable, dropping any date the
	// variant carries. Separate from a nil ExpirationDate so that "I am not
	// stating a date" stays distinct from "this does not expire", and so the
	// zero value of a Purchase can never erase anything.
	ClearExpiration bool `json:"clearExpiration" gorm:"-"`
}
