package domain

// Setting is one key/value configuration row (store_name, default_vat_rate, ...)
type Setting struct {
	Key   string `json:"key" gorm:"primaryKey"`
	Value string `json:"value"`
}
