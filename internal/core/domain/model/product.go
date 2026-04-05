package domain

// Product represents the base product information
type Product struct {
	ID          uint          `json:"id" gorm:"primaryKey"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	CategoryID  *uint         `json:"categoryId"`
	Variants    []ItemVariant `json:"variants" gorm:"foreignKey:ProductID"`
}
