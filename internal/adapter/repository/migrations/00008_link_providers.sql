-- +goose Up
-- +goose StatementBegin
-- Providers link to a product through provider_prices, never to a variant:
-- a variant with a provider FK would force a duplicate variant (and a duplicate
-- SKU, which is UNIQUE) per supplier. Only the purchase records who we bought from.
ALTER TABLE purchases ADD COLUMN provider_id INTEGER REFERENCES providers(id) ON DELETE SET NULL;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE purchases DROP COLUMN provider_id;
-- +goose StatementEnd
