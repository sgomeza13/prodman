-- +goose Up
-- +goose StatementBegin
-- variant_id has no FK on purpose: purchases are history and must survive
-- product/variant deletion; description is the display snapshot.
CREATE TABLE purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    variant_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost REAL NOT NULL,
    created_at DATETIME NOT NULL
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS purchases;
-- +goose StatementEnd
