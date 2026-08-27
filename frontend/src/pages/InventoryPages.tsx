import { useMemo, useState } from "react";
import { domain } from "../../wailsjs/go/models";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddItemModal } from "@/components/Item/AddItem/AddItemModal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatPrice } from "@/lib/utils";
import { Package, ChevronDown, ChevronRight, Layers, Pencil, Trash2, Search, AlertTriangle, Loader2, Scale, X } from "lucide-react";
import { ComparePricesDialog } from "@/components/ComparePricesDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useProducts, useDeleteProduct, useUpdateVariant } from "@/hooks/useProducts";
import { useSettings } from "@/hooks/useSettings";
import { ExpiryBadge, expiryIcon } from "@/components/ExpiryBadge";
import { EXPIRY_STYLES, expiryState, rollupExpiry, toDateInput, fromDateInput } from "@/lib/expiry";

const isLowStock = (v: domain.ItemVariant) => v.currentStock <= v.minStock;

/**
 * The vencimiento cue and its correction in one control: colour is the signal,
 * the input fixes a mistyped date and the clear button drops it for goods that
 * do not expire. Purchases remain the normal way to set it (docs/adr/0001).
 */
function VariantExpiryCell({ variant, warningDays }: { variant: domain.ItemVariant; warningDays: number }) {
  const { t } = useTranslation();
  const updateVariant = useUpdateVariant();
  const state = expiryState(variant, warningDays);
  const Icon = expiryIcon(state);

  const save = (value: string) =>
    updateVariant.mutate(new domain.ItemVariant({ ...variant, expirationDate: fromDateInput(value) }));

  return (
    <div className="flex items-center gap-1.5">
      {state !== "vigente" && (
        <Icon className={cn("w-3.5 h-3.5 shrink-0", EXPIRY_STYLES[state], "bg-transparent")} />
      )}
      <input
        type="date"
        aria-label={t("expiry.field")}
        title={t("expiry.field")}
        value={toDateInput(variant.expirationDate)}
        disabled={updateVariant.isPending}
        onChange={(e) => save(e.target.value)}
        className={cn(
          "bg-transparent border rounded-md px-1.5 py-0.5 text-xs tabular-nums",
          state === "vigente" ? "text-muted-foreground border-muted-foreground/20" : EXPIRY_STYLES[state]
        )}
      />
      {variant.expirationDate && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full text-muted-foreground hover:text-destructive"
          title={t("expiry.clear")}
          disabled={updateVariant.isPending}
          onClick={() => save("")}
        >
          <X className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

interface ProductRowProps {
  product: domain.Product;
  warningDays: number;
  onEdit: (product: domain.Product) => void;
  onDelete: (product: domain.Product) => void;
  onCompare: (product: domain.Product) => void;
}

function ProductRow({ product, warningDays, onEdit, onDelete, onCompare }: ProductRowProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const variants = product.variants || [];
  const totalStock = variants.reduce((sum, v) => sum + v.currentStock, 0);
  const anyLowStock = variants.some(isLowStock);
  const expiry = rollupExpiry(variants, warningDays);
  const priceRange = variants.length > 0
    ? {
        min: Math.min(...variants.map(v => v.price)),
        max: Math.max(...variants.map(v => v.price))
      }
    : null;

  return (
    <>
      <TableRow
        className={cn(
          "hover:bg-accent/30 transition-colors cursor-pointer group",
          isExpanded && "bg-accent/20 border-l-4 border-l-primary"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <TableCell className="w-10">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </TableCell>
        <TableCell className="font-bold py-5">
          <div className="flex items-center gap-3">
            {product.imagePath ? (
              <img
                src={product.imagePath}
                alt={product.name}
                loading="lazy"
                className="w-8 h-8 rounded-lg object-cover border"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Package className="h-4 w-4" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <div className="text-base">{product.name}</div>
                {product.brand && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground font-bold uppercase tracking-wider">
                    {product.brand.name}
                  </span>
                )}
                {product.category && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-bold uppercase tracking-wider">
                    {product.category.name}
                  </span>
                )}
                <ExpiryBadge state={expiry.state} date={expiry.date} />
              </div>
              {product.description && (
                <div className="text-xs text-muted-foreground font-normal line-clamp-1">
                  {product.description}
                </div>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3 w-3" />
            {variants.length} {variants.length === 1 ? t("inventory.table.variant") : t("inventory.table.variants_plural")}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1",
            anyLowStock
              ? 'bg-destructive/15 text-destructive border border-destructive/20'
              : 'bg-green-500/15 text-green-500 border border-green-500/20'
          )}>
            {anyLowStock && <AlertTriangle className="w-3 h-3" />}
            {totalStock} {t("inventory.table.total")}
          </span>
        </TableCell>
        <TableCell className="text-right font-mono font-medium">
          {priceRange ? (
            priceRange.min === priceRange.max
              ? formatPrice(priceRange.min)
              : `${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)}`
          ) : t("inventory.table.na")}
        </TableCell>
        <TableCell className="text-right w-32">
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-primary hover:bg-primary/10"
              title={t("provider.compare_title")}
              onClick={(e) => { e.stopPropagation(); onCompare(product); }}
            >
              <Scale className="w-4 h-4" />
            </Button>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={(e) => { e.stopPropagation(); onEdit(product); }}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10"
              onClick={(e) => { e.stopPropagation(); onDelete(product); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            </div>
          </div>
        </TableCell>
      </TableRow>

      {isExpanded && variants.map((variant) => (
        <TableRow key={variant.id} className="bg-muted/10 border-l-4 border-l-primary/30 animate-in slide-in-from-top-1 duration-200">
          <TableCell />
          <TableCell className="py-3 pl-12">
            <div className="flex flex-col">
              <span className="text-sm font-medium">{variant.sizing}</span>
              <span className="text-[10px] font-mono text-muted-foreground">{t("inventory.table.sku")}: {variant.sku}</span>
            </div>
          </TableCell>
          <TableCell className="text-xs" onClick={(e) => e.stopPropagation()}>
            <VariantExpiryCell variant={variant} warningDays={warningDays} />
          </TableCell>
          <TableCell className="text-right">
            <span className={cn(
              "text-sm font-semibold tabular-nums inline-flex items-center gap-1",
              isLowStock(variant) && "text-destructive"
            )}>
              {isLowStock(variant) && <AlertTriangle className="w-3 h-3" />}
              {variant.currentStock}{variant.unit ? ` ${variant.unit}` : ""}
            </span>
          </TableCell>
          <TableCell className="text-right font-mono text-sm tabular-nums">
            {formatPrice(variant.price)}
          </TableCell>
          <TableCell />
        </TableRow>
      ))}
    </>
  );
}

export default function InventoryPage() {
  const { t } = useTranslation();
  const { data: products = [], isLoading } = useProducts();
  const { data: settings } = useSettings();
  const deleteProduct = useDeleteProduct();
  const warningDays = Number(settings?.expiry_warning_days ?? 30);

  const [search, setSearch] = useState("");
  const [editingProduct, setEditingProduct] = useState<domain.Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<domain.Product | null>(null);
  const [comparingProduct, setComparingProduct] = useState<domain.Product | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.variants || []).some(v => v.sku.toLowerCase().includes(q))
    );
  }, [products, search]);

  const confirmDelete = () => {
    if (!deletingProduct) return;
    deleteProduct.mutate(deletingProduct.id, {
      onSuccess: () => setDeletingProduct(null),
    });
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end pb-2 border-b">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">{t("inventory.title")}</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {t("inventory.description")}
          </p>
        </div>
        <AddItemModal />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("inventory.search_placeholder")}
          className="rounded-xl border-muted-foreground/20 focus:border-primary h-11 pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border bg-card shadow-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ) : products.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold">{t("inventory.empty.title")}</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mb-8">
              {t("inventory.empty.description")}
            </p>
            <AddItemModal />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-20 text-center text-muted-foreground">
            {t("inventory.no_results")}
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="w-10" />
                <TableHead className="font-bold py-5 text-foreground">{t("inventory.table.product_name")}</TableHead>
                <TableHead className="font-bold py-5 text-foreground">{t("inventory.table.variants")}</TableHead>
                <TableHead className="text-right font-bold py-5 text-foreground">{t("inventory.table.total_stock")}</TableHead>
                <TableHead className="text-right font-bold py-5 text-foreground">{t("inventory.table.price_range")}</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  warningDays={warningDays}
                  onEdit={setEditingProduct}
                  onDelete={setDeletingProduct}
                  onCompare={setComparingProduct}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {comparingProduct && (
        <ComparePricesDialog
          product={comparingProduct}
          open={true}
          onOpenChange={(open) => { if (!open) setComparingProduct(null); }}
        />
      )}

      {editingProduct && (
        <AddItemModal
          product={editingProduct}
          open={true}
          onOpenChange={(open) => { if (!open) setEditingProduct(null); }}
        />
      )}

      <Dialog open={!!deletingProduct} onOpenChange={(open) => { if (!open) setDeletingProduct(null); }}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{t("common.confirm_delete_title")} {deletingProduct?.name}</DialogTitle>
            <DialogDescription>
              {t("product.delete_confirm")} {t("common.confirm_delete_warning")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setDeletingProduct(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={deleteProduct.isPending}
              onClick={confirmDelete}
            >
              {deleteProduct.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("common.delete")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
