package repository

import (
	domain "prodman/internal/core/domain/model"
)

type ProductRepository interface {
	Create(product *domain.Product) error
	GetByID(id uint) (*domain.Product, error)
	GetAll() ([]domain.Product, error)
	Update(product *domain.Product) error
	Delete(id uint) error

	// Variants
	CreateVariant(variant *domain.ItemVariant) error
	UpdateVariant(variant *domain.ItemVariant) error
	DeleteVariant(id uint) error
}
