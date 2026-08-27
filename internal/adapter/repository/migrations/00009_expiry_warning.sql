-- +goose Up
-- +goose StatementBegin
-- Days before a vencimiento at which a variant becomes "por vencer".
-- 0 means only already-expired stock is ever flagged.
INSERT INTO settings (key, value) VALUES ('expiry_warning_days', '30');
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DELETE FROM settings WHERE key = 'expiry_warning_days';
-- +goose StatementEnd
