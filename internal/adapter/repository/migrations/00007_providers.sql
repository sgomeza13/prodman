-- +goose Up
-- +goose StatementBegin
CREATE TABLE providers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    phone TEXT,
    description TEXT
);

CREATE TABLE provider_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id INTEGER NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    item_variant_id INTEGER NOT NULL REFERENCES item_variants(id) ON DELETE CASCADE,
    price REAL NOT NULL, -- ex-IVA
    updated_at DATETIME,
    UNIQUE(provider_id, item_variant_id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS provider_prices;
DROP TABLE IF EXISTS providers;
-- +goose StatementEnd
