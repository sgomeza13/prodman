import { useState } from "react";
import { BarChart3, TrendingUp, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatPrice } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useSalesReport, type ReportGranularity } from "@/hooks/useSales";

const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// "2026-07-27" → "27 jul" · "2026-W30" → "S30" · "2026-07" → "jul 26"
function formatPeriod(period: string, granularity: ReportGranularity): string {
  if (granularity === "daily") {
    const [, m, d] = period.split("-");
    return `${Number(d)} ${MONTHS_ES[Number(m) - 1] ?? ""}`;
  }
  if (granularity === "weekly") {
    return `S${period.split("-W")[1] ?? period}`;
  }
  const [y, m] = period.split("-");
  return `${MONTHS_ES[Number(m) - 1] ?? ""} ${y.slice(2)}`;
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const [granularity, setGranularity] = useState<ReportGranularity>("daily");
  const { data: rows = [], isLoading } = useSalesReport(granularity);

  // API returns newest-first; chart reads oldest→newest
  const chartRows = rows.slice(0, 14).reverse();
  const current = rows[0];
  const maxValue = Math.max(...chartRows.map((r) => Math.max(r.revenue, r.profit)), 1);

  const granularities: ReportGranularity[] = ["daily", "weekly", "monthly"];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end pb-2 border-b">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">{t("reports.title")}</h1>
          <p className="text-muted-foreground mt-2 text-lg">{t("reports.description")}</p>
        </div>
        <div className="flex gap-1 p-1 rounded-xl border bg-card">
          {granularities.map((g) => (
            <Button
              key={g}
              variant={granularity === g ? "default" : "ghost"}
              size="sm"
              className="rounded-lg"
              onClick={() => setGranularity(g)}
            >
              {t(`reports.${g}`)}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-8">
            <Skeleton className="h-32 rounded-3xl" />
            <Skeleton className="h-32 rounded-3xl" />
          </div>
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border bg-card shadow-xl p-20 text-center text-muted-foreground">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-20" />
          {t("reports.empty")}
        </div>
      ) : (
        <>
          {/* Current period stat tiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-3xl border bg-card shadow-xl">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                <Banknote className="w-4 h-4" />
                {t("reports.revenue")} · {t("reports.current_period")}
              </div>
              <div className="text-4xl font-extrabold tracking-tight mt-2 tabular-nums">
                {formatPrice(current?.revenue ?? 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {current ? formatPeriod(current.period, granularity) : ""}
              </div>
            </div>
            <div className="p-6 rounded-3xl border bg-card shadow-xl">
              <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                {t("reports.profit")} · {t("reports.current_period")}
              </div>
              <div className="text-4xl font-extrabold tracking-tight mt-2 tabular-nums">
                {formatPrice(current?.profit ?? 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {current ? formatPeriod(current.period, granularity) : ""}
              </div>
            </div>
          </div>

          {/* Bar chart: revenue vs profit per period */}
          <div className="p-6 rounded-3xl border bg-card shadow-xl">
            <div className="flex items-center gap-5 mb-6">
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--chart-1)" }} />
                {t("reports.revenue")}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--chart-2)" }} />
                {t("reports.profit")}
              </span>
            </div>

            <div className="flex items-end gap-2 h-64 overflow-x-auto">
              {chartRows.map((row) => (
                <div key={row.period} className="group relative flex-1 min-w-12 flex flex-col items-center gap-2 h-full">
                  {/* hover tooltip */}
                  <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 z-10 hidden group-hover:block whitespace-nowrap rounded-lg border bg-popover text-popover-foreground text-xs shadow-md px-3 py-2">
                    <div className="font-bold mb-0.5">{formatPeriod(row.period, granularity)}</div>
                    <div>{t("reports.revenue")}: <span className="font-mono tabular-nums">{formatPrice(row.revenue)}</span></div>
                    <div>{t("reports.profit")}: <span className="font-mono tabular-nums">{formatPrice(row.profit)}</span></div>
                  </div>
                  <div className="flex items-end justify-center gap-0.5 flex-1 w-full border-b group-hover:bg-accent/30 rounded-t-lg transition-colors pt-6">
                    <div
                      className="w-4 rounded-t"
                      style={{ background: "var(--chart-1)", height: `${(Math.max(row.revenue, 0) / maxValue) * 100}%` }}
                    />
                    <div
                      className="w-4 rounded-t"
                      style={{ background: "var(--chart-2)", height: `${(Math.max(row.profit, 0) / maxValue) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatPeriod(row.period, granularity)}
                  </span>
                </div>
              ))}
            </div>

            {/* accessible table view of the same data */}
            <details className="mt-6">
              <summary className="text-xs text-muted-foreground cursor-pointer select-none">
                {t("reports.period")} · {t("reports.revenue")} · {t("reports.profit")}
              </summary>
              <table className="mt-3 text-sm w-full max-w-md">
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.period} className="border-b border-muted-foreground/10">
                      <td className="py-1.5">{formatPeriod(row.period, granularity)}</td>
                      <td className="py-1.5 text-right font-mono tabular-nums">{formatPrice(row.revenue)}</td>
                      <td className="py-1.5 text-right font-mono tabular-nums">{formatPrice(row.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </div>
        </>
      )}
    </div>
  );
}
