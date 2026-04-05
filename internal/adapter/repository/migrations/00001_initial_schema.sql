-- +goose Up
-- +goose StatementBegin
CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    category_id INTEGER,
    current_stock INTEGER DEFAULT 0,
    expiration_date DATE,
    primary_supplier TEXT,
    price DECIMAL(10, 2),
    FOREIGN KEY(category_id) REFERENCES categories(id)
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS items;
DROP TABLE IF EXISTS categories;
-- +goose StatementEnd