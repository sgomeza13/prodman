-- +goose Up
-- +goose StatementBegin
DROP TABLE IF EXISTS items;

-- This represents the base "Product X"
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    FOREIGN KEY(category_id) REFERENCES categories(id)
);

-- This represents the specific "Product X - 1kg" and "Product X - 3kg"
CREATE TABLE item_variants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    sizing TEXT NOT NULL,  -- e.g., '1kg', '3kg', 'Large', 'Small'
    current_stock INTEGER DEFAULT 0,
    expiration_date DATE,
    primary_supplier TEXT,
    price DECIMAL(10, 2),
    FOREIGN KEY(product_id) REFERENCES products(id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS item_variants;
DROP TABLE IF EXISTS products;
-- +goose StatementEnd
