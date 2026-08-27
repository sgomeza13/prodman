package repository

import (
	"testing"
	"time"

	domain "prodman/internal/core/domain/model"
)

func expiryOf(t *testing.T, r *productRepository, id uint) *time.Time {
	t.Helper()
	var v domain.ItemVariant
	if err := r.db.First(&v, id).Error; err != nil {
		t.Fatal(err)
	}
	return v.ExpirationDate
}

func TestPurchaseStampsVencimientoOnVariant(t *testing.T) {
	r := testRepo(t)
	id := seedVariant(t, r, "SKU-E1", 0)

	first := time.Date(2026, 9, 15, 0, 0, 0, 0, time.UTC)
	err := r.CreatePurchase(&domain.Purchase{
		VariantID: id, Description: "x", Quantity: 5, UnitCost: 1000, ExpirationDate: &first,
	}, 0)
	if err != nil {
		t.Fatal(err)
	}
	if got := expiryOf(t, r, id); got == nil || !got.Equal(first) {
		t.Fatalf("expiry = %v, want %v", got, first)
	}

	// last write wins: the newest batch defines the date, no comparison (ADR-0001)
	second := time.Date(2027, 4, 1, 0, 0, 0, 0, time.UTC)
	err = r.CreatePurchase(&domain.Purchase{
		VariantID: id, Description: "x", Quantity: 5, UnitCost: 1000, ExpirationDate: &second,
	}, 0)
	if err != nil {
		t.Fatal(err)
	}
	if got := expiryOf(t, r, id); got == nil || !got.Equal(second) {
		t.Fatalf("expiry = %v, want %v (last write wins)", got, second)
	}

	// nil means "not stated": the standing date must survive
	if err := r.CreatePurchase(&domain.Purchase{
		VariantID: id, Description: "x", Quantity: 5, UnitCost: 1000,
	}, 0); err != nil {
		t.Fatal(err)
	}
	if got := expiryOf(t, r, id); got == nil || !got.Equal(second) {
		t.Fatalf("expiry = %v, want %v (nil must not clear)", got, second)
	}
}

func TestProductUpdateCannotEraseVencimiento(t *testing.T) {
	r := testRepo(t)
	id := seedVariant(t, r, "SKU-E2", 3)

	date := time.Date(2026, 12, 31, 0, 0, 0, 0, time.UTC)
	if err := r.CreatePurchase(&domain.Purchase{
		VariantID: id, Description: "x", Quantity: 1, UnitCost: 1000, ExpirationDate: &date,
	}, 0); err != nil {
		t.Fatal(err)
	}

	// the product form always sends expirationDate: null — a rename must not wipe it
	var p domain.Product
	if err := r.db.Preload("Variants").First(&p, "name = ?", "Dog Chow").Error; err != nil {
		t.Fatal(err)
	}
	p.Name = "Dog Chow Renamed"
	for i := range p.Variants {
		p.Variants[i].ExpirationDate = nil
	}
	if err := r.Update(&p); err != nil {
		t.Fatal(err)
	}

	if got := expiryOf(t, r, id); got == nil || !got.Equal(date) {
		t.Fatalf("expiry = %v, want %v (product edit must not clear it)", got, date)
	}
}

func TestUpdateVariantClearsVencimiento(t *testing.T) {
	r := testRepo(t)
	id := seedVariant(t, r, "SKU-E3", 4)

	date := time.Date(2026, 10, 1, 0, 0, 0, 0, time.UTC)
	if err := r.CreatePurchase(&domain.Purchase{
		VariantID: id, Description: "x", Quantity: 1, UnitCost: 1000, ExpirationDate: &date,
	}, 0); err != nil {
		t.Fatal(err)
	}

	// the inventory row's clear button: a variant saved with a nil date drops it
	var v domain.ItemVariant
	if err := r.db.First(&v, id).Error; err != nil {
		t.Fatal(err)
	}
	v.ExpirationDate = nil
	if err := r.UpdateVariant(&v); err != nil {
		t.Fatal(err)
	}

	if got := expiryOf(t, r, id); got != nil {
		t.Fatalf("expiry = %v, want nil (clearing must stick)", got)
	}
}

func TestNonPerishablePurchaseClearsVencimiento(t *testing.T) {
	r := testRepo(t)
	id := seedVariant(t, r, "SKU-E4", 2)

	date := time.Date(2026, 11, 30, 0, 0, 0, 0, time.UTC)
	if err := r.CreatePurchase(&domain.Purchase{
		VariantID: id, Description: "x", Quantity: 1, UnitCost: 1000, ExpirationDate: &date,
	}, 0); err != nil {
		t.Fatal(err)
	}

	// unticking "perecedero" on the purchase form drops the standing date
	if err := r.CreatePurchase(&domain.Purchase{
		VariantID: id, Description: "x", Quantity: 1, UnitCost: 1000, ClearExpiration: true,
	}, 0); err != nil {
		t.Fatal(err)
	}
	if got := expiryOf(t, r, id); got != nil {
		t.Fatalf("expiry = %v, want nil (non-perishable must clear)", got)
	}

	// and the zero value of a Purchase still cannot erase anything
	if err := r.CreatePurchase(&domain.Purchase{
		VariantID: id, Description: "x", Quantity: 1, UnitCost: 1000, ExpirationDate: &date,
	}, 0); err != nil {
		t.Fatal(err)
	}
	if err := r.CreatePurchase(&domain.Purchase{
		VariantID: id, Description: "x", Quantity: 1, UnitCost: 1000,
	}, 0); err != nil {
		t.Fatal(err)
	}
	if got := expiryOf(t, r, id); got == nil || !got.Equal(date) {
		t.Fatalf("expiry = %v, want %v (a purchase that says nothing must not clear)", got, date)
	}
}
