package main

import (
	"context"
	"fmt"

	domain "prodman/internal/core/domain/model"
	"prodman/internal/core/port/repository"
)

type App struct {
	ctx         context.Context
	productRepo repository.ProductRepository
}

func NewApp(productRepo repository.ProductRepository) *App {
	return &App{
		productRepo: productRepo,
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) GetProducts() ([]domain.Product, error) {
	return a.productRepo.GetAll()
}

func (a *App) CreateProduct(product *domain.Product) error {
	return a.productRepo.Create(product)
}

func (a *App) CreateVariant(variant *domain.ItemVariant) error {
	return a.productRepo.CreateVariant(variant)
}

func (a *App) GetBrands() ([]domain.Brand, error) {
	return a.productRepo.GetAllBrands()
}

func (a *App) CreateBrand(brand *domain.Brand) error {
	return a.productRepo.CreateBrand(brand)
}

func (a *App) UpdateBrand(brand *domain.Brand) error {
	return a.productRepo.UpdateBrand(brand)
}

func (a *App) DeleteBrand(id uint) error {
	return a.productRepo.DeleteBrand(id)
}

// Greet (Keeping this just for a quick test if needed!)
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, your database is connected!", name)
}
