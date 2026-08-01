package repository

import (
	"testing"

	domain "prodman/internal/core/domain/model"
)

func TestProviderPriceUpsertFetchAndCascade(t *testing.T) {
	r := testRepo(t)

	p := &domain.Product{
		Name: "Dog Chow",
		Variants: []domain.ItemVariant{
			{SKU: "SKU-P", Sizing: "2kg", Price: 10000, CostPrice: 6000, VatRate: 19},
		},
	}
	if err := r.Create(p); err != nil {
		t.Fatal(err)
	}
	variantID := p.Variants[0].ID

	a := &domain.Provider{Name: "AgroCali"}
	b := &domain.Provider{Name: "Distrivet"}
	for _, prov := range []*domain.Provider{a, b} {
		if err := r.CreateProvider(prov); err != nil {
			t.Fatal(err)
		}
	}

	save := func(providerID uint, price float64) {
		t.Helper()
		if err := r.SaveProviderPrice(&domain.ProviderPrice{
			ProviderID: providerID, ItemVariantID: variantID, Price: price,
		}); err != nil {
			t.Fatal(err)
		}
	}
	save(a.ID, 10000)
	save(b.ID, 9000)
	save(a.ID, 8000) // same provider+variant: must overwrite, not duplicate

	prices, err := r.GetProviderPrices(p.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(prices) != 2 {
		t.Fatalf("prices = %d, want 2 (upsert must not duplicate)", len(prices))
	}
	for _, pp := range prices {
		if pp.Provider == nil || pp.Provider.Name == "" {
			t.Errorf("provider not preloaded on price %d", pp.ID)
		}
		if pp.ProviderID == a.ID && pp.Price != 8000 {
			t.Errorf("upserted price = %v, want 8000", pp.Price)
		}
	}

	// deleting a provider must cascade its quotes (FK pragma + ON DELETE CASCADE)
	if err := r.DeleteProvider(a.ID); err != nil {
		t.Fatal(err)
	}
	prices, err = r.GetProviderPrices(p.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(prices) != 1 || prices[0].ProviderID != b.ID {
		t.Fatalf("after cascade: %d prices, want only Distrivet's", len(prices))
	}
}

// The product form hands its provider quotes to App.saveVariantQuotes right after
// the save, keyed by variant ID — so Create/Update must write the generated IDs
// back into the slice, and the transient Quotes field must never reach the DB.
func TestProductSaveWritesBackVariantIDs(t *testing.T) {
	r := testRepo(t)

	p := &domain.Product{
		Name: "Dog Chow",
		Variants: []domain.ItemVariant{
			{SKU: "SKU-A", Sizing: "2kg", Price: 10000, VatRate: 19,
				Quotes: []domain.ProviderPrice{{ProviderID: 1, Price: 6000}}},
		},
	}
	if err := r.Create(p); err != nil {
		t.Fatalf("create with quotes attached: %v", err)
	}
	if p.Variants[0].ID == 0 {
		t.Fatal("Create left the variant ID unset: quotes could not be attached")
	}

	// a variant added while editing must come back with an ID too
	p.Variants = append(p.Variants, domain.ItemVariant{
		ProductID: p.ID, SKU: "SKU-B", Sizing: "10kg", Price: 30000, VatRate: 19,
	})
	if err := r.Update(p); err != nil {
		t.Fatal(err)
	}
	if p.Variants[1].ID == 0 {
		t.Fatal("Update left the new variant's ID unset")
	}
}

func TestPurchaseFromProviderUpsertsQuote(t *testing.T) {
	r := testRepo(t)

	prov := &domain.Provider{Name: "AgroCali"}
	if err := r.CreateProvider(prov); err != nil {
		t.Fatal(err)
	}
	p := &domain.Product{
		Name: "Dog Chow",
		Variants: []domain.ItemVariant{
			{SKU: "SKU-Q", Sizing: "2kg", Price: 10000, CostPrice: 6000, VatRate: 19},
		},
	}
	if err := r.Create(p); err != nil {
		t.Fatal(err)
	}
	variantID := p.Variants[0].ID

	// two purchases from the same provider must leave one quote at the latest cost
	for _, cost := range []float64{5000, 4500} {
		err := r.CreatePurchase(&domain.Purchase{
			VariantID: variantID, Description: "Dog Chow 2kg", Quantity: 1,
			UnitCost: cost, ProviderID: &prov.ID,
		}, 0)
		if err != nil {
			t.Fatal(err)
		}
	}
	prices, err := r.GetProviderPrices(p.ID)
	if err != nil {
		t.Fatal(err)
	}
	if len(prices) != 1 || prices[0].Price != 4500 {
		t.Fatalf("quote = %+v, want single quote at 4500", prices)
	}
}
