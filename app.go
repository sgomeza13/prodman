package main

import (
	"context"
	"fmt"
	"io"
	"math"
	"os"
	"path/filepath"
	"strings"
	"time"

	wailsruntime "github.com/wailsapp/wails/v2/pkg/runtime"

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

func (a *App) UpdateProduct(product *domain.Product) error {
	return a.productRepo.Update(product)
}

func (a *App) DeleteProduct(id uint) error {
	return a.productRepo.Delete(id)
}

func (a *App) CreateVariant(variant *domain.ItemVariant) error {
	return a.productRepo.CreateVariant(variant)
}

func (a *App) UpdateVariant(variant *domain.ItemVariant) error {
	return a.productRepo.UpdateVariant(variant)
}

func (a *App) DeleteVariant(id uint) error {
	return a.productRepo.DeleteVariant(id)
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

func (a *App) GetCategories() ([]domain.Category, error) {
	return a.productRepo.GetAllCategories()
}

func (a *App) CreateCategory(category *domain.Category) error {
	return a.productRepo.CreateCategory(category)
}

func (a *App) UpdateCategory(category *domain.Category) error {
	return a.productRepo.UpdateCategory(category)
}

func (a *App) DeleteCategory(id uint) error {
	return a.productRepo.DeleteCategory(id)
}

func (a *App) GetSettings() (map[string]string, error) {
	return a.productRepo.GetSettings()
}

func (a *App) SaveSettings(settings map[string]string) error {
	return a.productRepo.SaveSettings(settings)
}

func (a *App) RecordPurchase(purchase *domain.Purchase, acceptedPrice float64) error {
	if purchase.Quantity <= 0 {
		return fmt.Errorf("la cantidad debe ser mayor a cero")
	}
	if purchase.UnitCost < 0 {
		return fmt.Errorf("el precio de compra no puede ser negativo")
	}
	purchase.ID = 0
	return a.productRepo.CreatePurchase(purchase, acceptedPrice)
}

func (a *App) GetPurchases(limit int) ([]domain.Purchase, error) {
	return a.productRepo.GetPurchases(limit)
}

// CreateSale recomputes the totals from the items server-side (never trust
// frontend math on the money path) and returns the stored sale so the receipt
// can show its ID and timestamp. COP has no cents, so totals are rounded.
func (a *App) CreateSale(sale *domain.Sale) (*domain.Sale, error) {
	if len(sale.Items) == 0 {
		return nil, fmt.Errorf("la venta no tiene artículos")
	}
	var subtotal, vat float64
	for _, item := range sale.Items {
		if item.Quantity <= 0 {
			return nil, fmt.Errorf("cantidad inválida: %s", item.Description)
		}
		line := float64(item.Quantity) * item.UnitPrice
		subtotal += line
		vat += line * item.VatRate / 100
	}
	sale.ID = 0
	sale.Subtotal = math.Round(subtotal)
	sale.VatAmount = math.Round(vat)
	sale.Total = math.Round(subtotal + vat)
	if err := a.productRepo.CreateSale(sale); err != nil {
		return nil, err
	}
	return sale, nil
}

func (a *App) GetSales(limit int) ([]domain.Sale, error) {
	return a.productRepo.GetSales(limit)
}

func (a *App) GetSalesReport(granularity string, limit int) ([]domain.ReportRow, error) {
	formats := map[string]string{
		"daily":   "%Y-%m-%d",
		"weekly":  "%Y-W%W",
		"monthly": "%Y-%m",
	}
	periodFmt, ok := formats[granularity]
	if !ok {
		return nil, fmt.Errorf("periodo inválido: %s", granularity)
	}
	return a.productRepo.GetSalesReport(periodFmt, limit)
}

// PickProductImage opens a native file dialog, copies the chosen image into the
// app's config dir and stores its served path on the product. Returns "" if the
// user cancelled.
func (a *App) PickProductImage(productID uint) (string, error) {
	file, err := wailsruntime.OpenFileDialog(a.ctx, wailsruntime.OpenDialogOptions{
		Title: "Seleccionar imagen",
		Filters: []wailsruntime.FileFilter{
			{DisplayName: "Imágenes (*.png;*.jpg)", Pattern: "*.png;*.jpg;*.jpeg;*.webp"},
		},
	})
	if err != nil || file == "" {
		return "", err
	}

	imagesDir, err := imagesDirPath()
	if err != nil {
		return "", err
	}
	if err := os.MkdirAll(imagesDir, 0o755); err != nil {
		return "", fmt.Errorf("no se pudo crear la carpeta de imágenes: %w", err)
	}

	name := fmt.Sprintf("product_%d%s", productID, strings.ToLower(filepath.Ext(file)))
	src, err := os.Open(file)
	if err != nil {
		return "", fmt.Errorf("no se pudo leer la imagen: %w", err)
	}
	defer src.Close()
	dst, err := os.Create(filepath.Join(imagesDir, name))
	if err != nil {
		return "", fmt.Errorf("no se pudo guardar la imagen: %w", err)
	}
	defer dst.Close()
	if _, err := io.Copy(dst, src); err != nil {
		return "", fmt.Errorf("no se pudo copiar la imagen: %w", err)
	}
	// ponytail: raw copy; add stdlib downscale if phone photos make the list slow.

	// ?v= busts WebView2's cache when the photo is replaced with the same name
	webPath := fmt.Sprintf("/images/%s?v=%d", name, time.Now().Unix())
	if err := a.productRepo.UpdateProductImage(productID, webPath); err != nil {
		return "", err
	}
	return webPath, nil
}

func imagesDirPath() (string, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configDir, "prodman", "images"), nil
}
