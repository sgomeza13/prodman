package domain

// Product represents the base product information
type Product struct {
	ID          uint          `json:"id" gorm:"primaryKey"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	ImagePath   string        `json:"imagePath"`
	CategoryID  *uint         `json:"categoryId"`
	BrandID     *uint         `json:"brandId"`
	Brand       *Brand        `json:"brand" gorm:"foreignKey:BrandID"`
	Category    *Category     `json:"category" gorm:"foreignKey:CategoryID"`
	Variants    []ItemVariant `json:"variants" gorm:"foreignKey:ProductID"`
}
