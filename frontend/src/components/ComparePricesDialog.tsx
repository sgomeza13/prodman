import { useState } from "react";
import { Link } from "react-router";
import { Loader2, Pencil, Plus, Scale, Trash2, Trophy } from "lucide-react";
import { domain } from "../../wailsjs/go/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn, formatPrice } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import {
  useProviders,
  useProviderPrices,
  useSaveProviderPrice,
  useDeleteProviderPrice,
} from "@/hooks/useProviders";

interface ComparePricesDialogProps {
  product: domain.Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ComparePricesDialog({ product, open, onOpenChange }: ComparePricesDialogProps) {
  const { t } = useTranslation();
  const variants = product.variants || [];

  const [variantId, setVariantId] = useState<number | undefined>(variants[0]?.id);
  const [providerId, setProviderId] = useState("");
  const [price, setPrice] = useState(0);
  const [priceDisplay, setPriceDisplay] = useState("");

  const { data: providers = [] } = useProviders();
  const { data: prices = [], isLoading } = useProviderPrices(product.id, open);
  const savePrice = useSaveProviderPrice(product.id);
  const deletePrice = useDeleteProviderPrice(product.id);

  const rows = prices
    .filter((p) => p.itemVariantId === variantId)
    .sort((a, b) => a.price - b.price);
  const cheapest = rows[0];

  const moneyProps = {
    value: priceDisplay,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setPriceDisplay(raw);
      setPrice(parseFloat(raw.replace(/[^0-9.]/g, "")) || 0);
    },
    onBlur: () => {
      if (price > 0) setPriceDisplay(formatPrice(price));
    },
    onFocus: () => setPriceDisplay(price > 0 ? price.toString() : ""),
  };

  const resetForm = () => {
    setProviderId("");
    setPrice(0);
    setPriceDisplay("");
  };

  const startEdit = (pp: domain.ProviderPrice) => {
    setProviderId(String(pp.providerId));
    setPrice(pp.price);
    setPriceDisplay(formatPrice(pp.price));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerId || !variantId || price <= 0) return;
    savePrice.mutate(
      new domain.ProviderPrice({
        providerId: Number(providerId),
        itemVariantId: variantId,
        price,
      }),
      { onSuccess: resetForm }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            {t("provider.compare_title")} · {product.name}
          </DialogTitle>
          <DialogDescription>{t("provider.ex_vat")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid gap-2 max-w-xs">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
              {t("provider.variant")}
            </Label>
            <Select
              value={variantId !== undefined ? String(variantId) : ""}
              onValueChange={(v) => setVariantId(Number(v))}
            >
              <SelectTrigger className="rounded-xl h-11 border-muted-foreground/20 shadow-none w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {variants.map((v) => (
                  <SelectItem key={v.id} value={String(v.id)}>
                    {v.sizing} · {v.sku}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Scale className="w-10 h-10 mx-auto mb-3 opacity-20" />
              {t("provider.compare_empty")}
            </div>
          ) : (
            <div className="rounded-2xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="font-bold text-foreground">{t("provider.title")}</TableHead>
                    <TableHead className="text-right font-bold text-foreground">{t("provider.price_ex_vat")}</TableHead>
                    <TableHead className="text-right font-bold text-foreground">{t("provider.diff")}</TableHead>
                    <TableHead className="text-right font-bold text-foreground">{t("provider.updated")}</TableHead>
                    <TableHead className="w-20" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((pp, i) => (
                    <TableRow
                      key={pp.id}
                      className={cn(
                        "group",
                        i === 0 && "bg-green-500/5 border-l-4 border-l-green-500"
                      )}
                    >
                      <TableCell className="py-4">
                        <div className={cn("font-medium", i === 0 && "font-bold")}>
                          {pp.provider?.name}
                        </div>
                        {pp.provider?.phone && (
                          <div className="text-xs text-muted-foreground">{pp.provider.phone}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums font-medium">
                        {formatPrice(pp.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        {i === 0 ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 bg-green-500/15 text-green-500 border border-green-500/20">
                            <Trophy className="w-3 h-3" />
                            {t("provider.cheapest")}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground tabular-nums">
                            +{(((pp.price - cheapest.price) / cheapest.price) * 100).toFixed(1)}%
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {pp.updatedAt ? new Date(pp.updatedAt).toLocaleDateString("es-CO") : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => startEdit(pp)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {/* ponytail: no confirm on quote delete — it's one re-typeable number */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
                            disabled={deletePrice.isPending}
                            onClick={() => deletePrice.mutate(pp.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {providers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">
              {t("provider.no_providers")}{" "}
              <Link to="/providers" className="text-primary underline" onClick={() => onOpenChange(false)}>
                {t("provider.title")}
              </Link>
            </p>
          ) : (
            <form onSubmit={handleSave} className="flex items-end gap-3">
              <div className="grid gap-2 flex-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  {t("provider.title")}
                </Label>
                <Select value={providerId} onValueChange={setProviderId}>
                  <SelectTrigger className="rounded-xl h-11 border-muted-foreground/20 shadow-none w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 flex-1">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  {t("provider.price_ex_vat")}
                </Label>
                <Input
                  className="rounded-xl border-muted-foreground/20 focus:border-primary h-11 font-mono"
                  placeholder="$ 0"
                  {...moneyProps}
                />
              </div>
              <Button
                type="submit"
                className="rounded-xl h-11 shadow-lg shadow-primary/20"
                disabled={savePrice.isPending || !providerId || price <= 0}
              >
                {savePrice.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-1" />
                    {t("provider.add_price")}
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
