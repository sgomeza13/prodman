import { useMemo } from "react";
import { CalendarClock, PackageCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatPrice } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks/useProducts";
import { useSettings } from "@/hooks/useSettings";
import { ExpiryBadge } from "@/components/ExpiryBadge";
import { daysUntilExpiry, expiryState, type ExpiryState } from "@/lib/expiry";

interface ExpiringRow {
  variantId: number;
  product: string;
  sizing: string;
  sku: string;
  stock: number;
  unit: string;
  price: number;
  date: string;
  state: ExpiryState;
  days: number;
}

export default function ExpiringPage() {
  const { t } = useTranslation();
  const { data: products = [], isLoading } = useProducts();
  const { data: settings } = useSettings();
  const warningDays = Number(settings?.expiry_warning_days ?? 30);

  // Same predicate as the inventory badges, so the two can never disagree.
  const rows: ExpiringRow[] = useMemo(
    () =>
      products
        .flatMap((p) =>
          (p.variants || []).map((v) => ({
            variantId: v.id,
            product: p.name,
            sizing: v.sizing,
            sku: v.sku,
            stock: v.currentStock,
            unit: v.unit,
            price: v.price,
            date: String(v.expirationDate ?? ""),
            state: expiryState(v, warningDays),
            days: v.expirationDate ? daysUntilExpiry(String(v.expirationDate)) : 0,
          }))
        )
        .filter((r) => r.state !== "vigente")
        .sort((a, b) => a.days - b.days),
    [products, warningDays]
  );

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="pb-2 border-b">
        <h1 className="text-4xl font-extrabold tracking-tight">{t("expiring.title")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {t("expiring.description", { days: warningDays })}
        </p>
      </div>

      <div className="rounded-2xl border bg-card shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-6">
              <PackageCheck className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold">{t("expiring.empty.title")}</h3>
            <p className="text-muted-foreground mt-2 max-w-sm">{t("expiring.empty.description")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="font-bold py-5 text-foreground">{t("expiring.table.product")}</TableHead>
                <TableHead className="font-bold py-5 text-foreground">{t("expiring.table.expires")}</TableHead>
                <TableHead className="font-bold py-5 text-foreground">{t("expiring.table.remaining")}</TableHead>
                <TableHead className="text-right font-bold py-5 text-foreground">{t("inventory.table.total_stock")}</TableHead>
                <TableHead className="text-right font-bold py-5 text-foreground">{t("expiring.table.value")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.variantId} className="hover:bg-accent/30 transition-colors">
                  <TableCell className="py-4">
                    <div className="font-medium">{r.product} {r.sizing}</div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {t("inventory.table.sku")}: {r.sku}
                    </div>
                  </TableCell>
                  <TableCell>
                    <ExpiryBadge state={r.state} date={r.date} />
                  </TableCell>
                  <TableCell className={cn("text-sm tabular-nums", r.state === "vencido" ? "text-destructive" : "text-amber-500")}>
                    {r.days < 0
                      ? t("expiring.overdue", { days: Math.abs(r.days) })
                      : t("expiring.in_days", { days: r.days })}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {r.stock}{r.unit ? ` ${r.unit}` : ""}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {formatPrice(r.stock * r.price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {rows.length > 0 && (
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <CalendarClock className="w-4 h-4" />
          {t("expiring.footer", { total: rows.length })}
        </p>
      )}
    </div>
  );
}
