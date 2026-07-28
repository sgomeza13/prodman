import { useState } from "react";
import { Receipt, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice, formatDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useSales } from "@/hooks/useSales";
import { PrintInvoice } from "@/components/Invoice/PrintInvoice";
import { domain } from "../../wailsjs/go/models";

export default function SalesHistoryPage() {
  const { t } = useTranslation();
  const { data: sales = [], isLoading } = useSales();
  const [viewingSale, setViewingSale] = useState<domain.Sale | null>(null);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="pb-2 border-b">
        <h1 className="text-4xl font-extrabold tracking-tight">{t("sales.title")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{t("sales.description")}</p>
      </div>

      <div className="rounded-2xl border bg-card shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : sales.length === 0 ? (
          <div className="p-20 text-center text-muted-foreground">
            <Receipt className="w-12 h-12 mx-auto mb-4 opacity-20" />
            {t("sales.empty")}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="font-bold py-5 text-foreground">{t("sales.receipt_no")}</TableHead>
                <TableHead className="font-bold py-5 text-foreground">{t("common.date")}</TableHead>
                <TableHead className="font-bold py-5 text-foreground">{t("sales.items")}</TableHead>
                <TableHead className="text-right font-bold py-5 text-foreground">{t("invoice.subtotal")}</TableHead>
                <TableHead className="text-right font-bold py-5 text-foreground">{t("invoice.vat")}</TableHead>
                <TableHead className="text-right font-bold py-5 text-foreground">{t("invoice.total")}</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => {
                const items = sale.items || [];
                const itemsLabel = items.map((i) => `${i.quantity}x ${i.description}`).join(", ");
                return (
                  <TableRow
                    key={sale.id}
                    className="hover:bg-accent/30 transition-colors cursor-pointer group"
                    onClick={() => setViewingSale(sale)}
                  >
                    <TableCell className="font-mono font-bold py-4">#{sale.id}</TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(sale.createdAt)}
                    </TableCell>
                    <TableCell className="max-w-md">
                      <span className="text-sm line-clamp-1">{itemsLabel}</span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-sm">
                      {formatPrice(sale.subtotal)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums text-sm">
                      {formatPrice(sale.vatAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold tabular-nums">
                      {formatPrice(sale.total)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title={t("sales.reprint")}
                        className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); setViewingSale(sale); }}
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <PrintInvoice sale={viewingSale} onClose={() => setViewingSale(null)} />
    </div>
  );
}
