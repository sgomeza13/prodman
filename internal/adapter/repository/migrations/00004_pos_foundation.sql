-- +goose Up
-- +goose StatementBegin
ALTER TABLE item_variants ADD COLUMN cost_price REAL NOT NULL DEFAULT 0;
ALTER TABLE item_variants ADD COLUMN min_stock INTEGER NOT NULL DEFAULT 10;
ALTER TABLE item_variants ADD COLUMN unit TEXT NOT NULL DEFAULT '';
ALTER TABLE item_variants ADD COLUMN vat_rate REAL NOT NULL DEFAULT 19;
ALTER TABLE products ADD COLUMN image_path TEXT NOT NULL DEFAULT '';

CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO settings (key, value) VALUES
    ('store_name', 'Mi Veterinaria'),
    ('default_vat_rate', '19'),
    ('default_margin_pct', '30'),
    ('print_format', 'thermal');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS settings;
ALTER TABLE products DROP COLUMN image_path;
ALTER TABLE item_variants DROP COLUMN vat_rate;
ALTER TABLE item_variants DROP COLUMN unit;
ALTER TABLE item_variants DROP COLUMN min_stock;
ALTER TABLE item_variants DROP COLUMN cost_price;
-- +goose StatementEnd
