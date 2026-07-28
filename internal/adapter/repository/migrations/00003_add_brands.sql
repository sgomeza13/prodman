-- +goose Up
-- +goose StatementBegin
CREATE TABLE brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

ALTER TABLE products ADD COLUMN brand_id INTEGER REFERENCES brands(id);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE products DROP COLUMN brand_id;
DROP TABLE IF EXISTS brands;
-- +goose StatementEnd
