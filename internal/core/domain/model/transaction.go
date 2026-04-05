package domain

import "time"

// Transaction represents an audit trail of stock changes (In, Out, Audit)
type Transaction struct {
	ID        uint      `json:"id"`
	ItemVariantID uint      `json:"itemVariantId"`
	Type      string    `json:"type"`
	Quantity  int       `json:"quantity"`
	Notes     string    `json:"notes"`
	Timestamp time.Time `json:"timestamp"`
}
