import { useMemo, useState } from "react";
import { Loader2, Truck, Search, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatPrice, formatDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks/useProducts";
import { usePurchases, useRecordPurchase } from "@/hooks/usePurchases";
import { useSettings } from "@/hooks/useSettings";
import { domain } from "../../wailsjs/go/models";

interface VariantOption {
  variantId: number;
  label: string;
  sku: string;
}

export default function PurchasesPage() {
  const { t } = useTranslation();
  const { data: products = [] } = useProducts();
  const { data: purchases = [], isLoading: loadingHistory } = usePurchases();
  const { data: settings } = useSettings();
  const recordPurchase = useRecordPurchase();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<VariantOption | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [costDisplay, setCostDisplay] = useState("");
  const [vatRate, setVatRate] = useState<string | null>(null);
  const [margin, setMargin] = useState<string | null>(null);
  const [applyPrice, setApplyPrice] = useState(false);

  const effectiveVat = Number(vatRate ?? settings?.default_vat_rate ?? 19);
  const effectiveMargin = Number(margin ?? settings?.default_margin_pct ?? 30);

  const options: VariantOption[] = useMemo(
    () =>
      products.flatMap((p) =>
        (p.variants || []).map((v) => ({
          variantId: v.id,
          label: `${p.name} ${v.sizing}`.trim(),
          sku: v.sku,
        }))
      ),
    [products]
  );

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options.slice(0, 8);
    return options
      .filter((o) => o.label.toLowerCase().includes(q) || o.sku.toLowerCase().includes(q))
      .slice(0, 8);
  }, [options, search]);

  const vatAmount = unitCost * effectiveVat / 100;
  const finalCost = unitCost + vatAmount;
  const suggestedPrice = Math.round(unitCost * (1 + effectiveMargin / 100));

  const resetForm = () => {
    setSelected(null);
    setSearch("");
    setQuantity(1);
    setUnitCost(0);
    setCostDisplay("");
    setApplyPrice(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;

    recordPurchase.mutate(
      {
        purchase: new domain.Purchase({
          variantId: selected.variantId,
          description: selected.label,
          quantity: Number(quantity),
          unitCost: Number(unitCost),
        }),
        acceptedPrice: applyPrice ? suggestedPrice : 0,
      },
      {
        onSuccess: () => {
          toast.success(t("purchases.recorded"));
          resetForm();
        },
      }
    );
  };

  const labelClass = "text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1";
  const inputClass = "rounded-xl border-muted-foreground/20 focus:border-primary h-11";

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="pb-2 border-b">
        <h1 className="text-4xl font-extrabold tracking-tight">{t("purchases.title")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{t("purchases.description")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Entry form */}
        <div className="lg:col-span-2">
          <div className="p-6 rounded-3xl border bg-card shadow-xl space-y-5">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-primary" />
              {t("purchases.new_entry")}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Product picker */}
              <div className="grid gap-2">
                <Label className={labelClass}>{t("purchases.product")}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("purchases.product_placeholder")}
                    className={cn(inputClass, "pl-9")}
                    value={selected ? selected.label : search}
                    onChange={(e) => {
                      setSelected(null);
                      setSearch(e.target.value);
                    }}
                    required={!selected}
                  />
                </div>
                {!selected && (
                  <div className="rounded-xl border divide-y max-h-56 overflow-y-auto">
                    {filteredOptions.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">{t("pos.no_results")}</div>
                    ) : (
                      filteredOptions.map((o) => (
                        <button
                          key={o.variantId}
                          type="button"
                          className="w-full text-left p-3 hover:bg-accent/50 transition-colors"
                          onClick={() => setSelected(o)}
                        >
                          <div className="text-sm font-medium">{o.label}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{o.sku}</div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="qty" className={labelClass}>{t("purchases.quantity")}</Label>
                  <Input
                    id="qty"
                    type="number"
                    min="1"
                    className={inputClass}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="vat" className={labelClass}>{t("purchases.vat_rate")}</Label>
                  <Select value={String(effectiveVat)} onValueChange={setVatRate}>
                    <SelectTrigger id="vat" className="rounded-xl h-11 border-muted-foreground/20 shadow-none w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="19">19%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="0">0%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="cost" className={labelClass}>{t("purchases.unit_cost")}</Label>
                <Input
                  id="cost"
                  placeholder="0"
                  className={inputClass}
                  value={costDisplay}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setCostDisplay(raw);
                    setUnitCost(parseFloat(raw.replace(/[^0-9.]/g, "")) || 0);
                  }}
                  onBlur={() => { if (unitCost > 0) setCostDisplay(formatPrice(unitCost)); }}
                  onFocus={() => setCostDisplay(unitCost > 0 ? unitCost.toString() : "")}
                  required
                />
              </div>

              {/* IVA calculator */}
              <div className="rounded-2xl border bg-muted/30 p-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("purchases.price_before_vat")}</span>
                  <span className="font-mono tabular-nums">{formatPrice(unitCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("purchases.vat_amount")} ({effectiveVat}%)</span>
                  <span className="font-mono tabular-nums">{formatPrice(vatAmount)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-1.5">
                  <span>{t("purchases.final_price")}</span>
                  <span className="font-mono tabular-nums">{formatPrice(finalCost)}</span>
                </div>
              </div>

              {/* Suggested selling price */}
              <div className="rounded-2xl border bg-primary/5 p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-muted-foreground">{t("purchases.margin")}</span>
                  <Input
                    type="number"
                    min="0"
                    className="rounded-lg h-9 w-24 text-right"
                    value={effectiveMargin}
                    onChange={(e) => setMargin(e.target.value)}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{t("purchases.suggested")}</span>
                  <span className="font-mono font-bold text-lg tabular-nums text-primary">
                    {formatPrice(suggestedPrice)}
                  </span>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-primary"
                    checked={applyPrice}
                    onChange={(e) => setApplyPrice(e.target.checked)}
                  />
                  {t("purchases.apply_price")}
                </label>
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl h-11 shadow-lg shadow-primary/20"
                disabled={recordPurchase.isPending || !selected}
              >
                {recordPurchase.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Truck className="w-4 h-4 mr-2" />
                    {t("purchases.record_button")}
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* History */}
        <div className="lg:col-span-3">
          <div className="rounded-3xl border bg-card shadow-xl overflow-hidden">
            <div className="p-6 border-b bg-muted/30">
              <h2 className="text-xl font-bold">{t("purchases.history")}</h2>
            </div>
            {loadingHistory ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : purchases.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Truck className="w-12 h-12 mx-auto mb-4 opacity-20" />
                {t("purchases.empty_history")}
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="font-bold text-foreground">{t("common.date")}</TableHead>
                    <TableHead className="font-bold text-foreground">{t("purchases.product")}</TableHead>
                    <TableHead className="text-right font-bold text-foreground">{t("pos.qty")}</TableHead>
                    <TableHead className="text-right font-bold text-foreground">{t("purchases.unit_cost")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDate(purchase.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{purchase.description}</TableCell>
                      <TableCell className="text-right tabular-nums">{purchase.quantity}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {formatPrice(purchase.unitCost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
