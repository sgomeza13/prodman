-- +goose Up
-- +goose StatementBegin
CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subtotal REAL NOT NULL,
    vat_amount REAL NOT NULL,
    total REAL NOT NULL,
    created_at DATETIME NOT NULL
);

-- sale_items snapshots description/price/cost/vat at sale time so history and
-- profit reports survive later product edits or deletion (no FK on variant_id).
CREATE TABLE sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER NOT NULL REFERENCES sales(id),
    variant_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    cost_price REAL NOT NULL,
    vat_rate REAL NOT NULL
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS sale_items;
DROP TABLE IF EXISTS sales;
-- +goose StatementEnd
