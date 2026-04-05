package repository

import (
	"gorm.io/gorm"

	domain "prodman/internal/core/domain/model"
	"prodman/internal/core/port/repository"
)

type productRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) repository.ProductRepository {
	return &productRepository{
		db: db,
	}
}

func (r *productRepository) Create(product *domain.Product) error {
	return r.db.Create(product).Error
}

func (r *productRepository) GetByID(id uint) (*domain.Product, error) {
	var product domain.Product
	err := r.db.Preload("Variants").First(&product, id).Error
	if err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productRepository) GetAll() ([]domain.Product, error) {
	var products []domain.Product
	err := r.db.Preload("Variants").Find(&products).Error
	return products, err
}

func (r *productRepository) Update(product *domain.Product) error {
	return r.db.Save(product).Error
}

func (r *productRepository) Delete(id uint) error {
	return r.db.Delete(&domain.Product{}, id).Error
}

func (r *productRepository) CreateVariant(variant *domain.ItemVariant) error {
	return r.db.Create(variant).Error
}

func (r *productRepository) UpdateVariant(variant *domain.ItemVariant) error {
	return r.db.Save(variant).Error
}

func (r *productRepository) DeleteVariant(id uint) error {
	return r.db.Delete(&domain.ItemVariant{}, id).Error
}
