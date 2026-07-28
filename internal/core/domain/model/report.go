package domain

// ReportRow is one aggregated period (day/week/month) of sales
type ReportRow struct {
	Period  string  `json:"period"`
	Revenue float64 `json:"revenue"`
	Profit  float64 `json:"profit"`
}
