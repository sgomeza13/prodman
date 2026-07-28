package repository

import (
	"path/filepath"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/pressly/goose/v3"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	domain "prodman/internal/core/domain/model"
)

func testRepo(t *testing.T) *productRepository {
	t.Helper()
	dbPath := filepath.Join(t.TempDir(), "test.db")
	db, err := gorm.Open(sqlite.Open(dbPath+"?_pragma=foreign_keys(1)"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatal(err)
	}
	sqlDB, _ := db.DB()
	goose.SetBaseFS(embedMigrations)
	goose.SetLogger(goose.NopLogger())
	if err := goose.SetDialect("sqlite3"); err != nil {
		t.Fatal(err)
	}
	if err := goose.Up(sqlDB, "migrations"); err != nil {
		t.Fatalf("migrations failed on fresh DB: %v", err)
	}
	return &productRepository{db: db}
}

func seedVariant(t *testing.T, r *productRepository, sku string, stock int) uint {
	t.Helper()
	p := &domain.Product{
		Name: "Dog Chow",
		Variants: []domain.ItemVariant{
			{SKU: sku, Sizing: "2kg", CurrentStock: stock, Price: 10000, CostPrice: 6000, VatRate: 19},
		},
	}
	if err := r.Create(p); err != nil {
		t.Fatal(err)
	}
	return p.Variants[0].ID
}

func stockOf(t *testing.T, r *productRepository, id uint) int {
	t.Helper()
	var v domain.ItemVariant
	if err := r.db.First(&v, id).Error; err != nil {
		t.Fatal(err)
	}
	return v.CurrentStock
}

func TestPurchaseAddsStockAndUpdatesPrices(t *testing.T) {
	r := testRepo(t)
	id := seedVariant(t, r, "SKU-1", 5)

	err := r.CreatePurchase(&domain.Purchase{
		VariantID: id, Description: "Dog Chow 2kg", Quantity: 10, UnitCost: 5000,
	}, 6500)
	if err != nil {
		t.Fatal(err)
	}

	var v domain.ItemVariant
	r.db.First(&v, id)
	if v.CurrentStock != 15 {
		t.Errorf("stock = %d, want 15", v.CurrentStock)
	}
	if v.CostPrice != 5000 {
		t.Errorf("cost = %v, want 5000", v.CostPrice)
	}
	if v.Price != 6500 {
		t.Errorf("price = %v, want 6500 (accepted suggested price)", v.Price)
	}
}

func TestSaleDeductsStockAndRejectsInsufficientAtomically(t *testing.T) {
	r := testRepo(t)
	a := seedVariant(t, r, "SKU-A", 10)
	b := seedVariant(t, r, "SKU-B", 2)

	ok := &domain.Sale{Subtotal: 30000, VatAmount: 5700, Total: 35700, Items: []domain.SaleItem{
		{VariantID: a, Description: "A", Quantity: 3, UnitPrice: 10000, CostPrice: 6000, VatRate: 19},
	}}
	if err := r.CreateSale(ok); err != nil {
		t.Fatal(err)
	}
	if got := stockOf(t, r, a); got != 7 {
		t.Errorf("stock a = %d, want 7", got)
	}

	// second item exceeds stock: whole sale must roll back, including item a's deduction
	bad := &domain.Sale{Items: []domain.SaleItem{
		{VariantID: a, Description: "A", Quantity: 1, UnitPrice: 10000},
		{VariantID: b, Description: "B", Quantity: 5, UnitPrice: 10000},
	}}
	if err := r.CreateSale(bad); err == nil {
		t.Fatal("expected stock insuficiente error")
	}
	if got := stockOf(t, r, a); got != 7 {
		t.Errorf("rollback failed: stock a = %d, want 7", got)
	}
	if got := stockOf(t, r, b); got != 2 {
		t.Errorf("rollback failed: stock b = %d, want 2", got)
	}
}

func TestSalesReportBucketsRevenueAndProfit(t *testing.T) {
	r := testRepo(t)
	id := seedVariant(t, r, "SKU-R", 100)

	for i := 0; i < 2; i++ {
		sale := &domain.Sale{Items: []domain.SaleItem{
			{VariantID: id, Description: "R", Quantity: 2, UnitPrice: 10000, CostPrice: 6000, VatRate: 19},
		}}
		if err := r.CreateSale(sale); err != nil {
			t.Fatal(err)
		}
	}

	rows, err := r.GetSalesReport("%Y-%m-%d", 10)
	if err != nil {
		t.Fatal(err)
	}
	if len(rows) != 1 {
		t.Fatalf("rows = %d, want 1 (both sales today; CreatedAt format must be strftime-bucketable)", len(rows))
	}
	if rows[0].Revenue != 40000 {
		t.Errorf("revenue = %v, want 40000", rows[0].Revenue)
	}
	if rows[0].Profit != 16000 {
		t.Errorf("profit = %v, want 16000", rows[0].Profit)
	}
}
