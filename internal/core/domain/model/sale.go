package domain

import "time"

// Sale is a confirmed POS invoice; its ID doubles as the receipt number.
type Sale struct {
	ID        uint       `json:"id" gorm:"primaryKey"`
	Subtotal  float64    `json:"subtotal"`  // sum of base prices, ex-IVA
	VatAmount float64    `json:"vatAmount"`
	Total     float64    `json:"total"`
	CreatedAt time.Time  `json:"createdAt"`
	Items     []SaleItem `json:"items" gorm:"foreignKey:SaleID"`
}

// SaleItem snapshots description/price/cost/vat at sale time so history and
// profit reports survive later product edits.
type SaleItem struct {
	ID          uint    `json:"id" gorm:"primaryKey"`
	SaleID      uint    `json:"saleId"`
	VariantID   uint    `json:"variantId"`
	Description string  `json:"description"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unitPrice"` // base price ex-IVA at sale time
	CostPrice   float64 `json:"costPrice"` // COGS snapshot for profit reports
	VatRate     float64 `json:"vatRate"`
}
