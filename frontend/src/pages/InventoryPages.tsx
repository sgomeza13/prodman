import { useState } from "react";
import { domain } from "../../wailsjs/go/models";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddItemModal } from "@/components/Item/AddItem/AddItemModal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatPrice } from "@/lib/utils";
import { Package, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks/useProducts";

interface ProductRowProps {
  product: domain.Product;
}

function ProductRow({ product }: ProductRowProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const variants = product.variants || [];
  const totalStock = variants.reduce((sum, v) => sum + v.currentStock, 0);
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
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Package className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <div className="text-base">{product.name}</div>
                {product.brand && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground font-bold uppercase tracking-wider">
                    {product.brand.name}
                  </span>
                )}
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
            "px-3 py-1 rounded-full text-xs font-bold inline-flex items-center",
            totalStock < 10 
              ? 'bg-destructive/15 text-destructive border border-destructive/20' 
              : 'bg-green-500/15 text-green-500 border border-green-500/20'
          )}>
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
          <TableCell className="text-xs text-muted-foreground">
            {t("inventory.table.individual_variant")}
          </TableCell>
          <TableCell className="text-right">
            <span className="text-sm font-semibold tabular-nums">
              {variant.currentStock}
            </span>
          </TableCell>
          <TableCell className="text-right font-mono text-sm tabular-nums">
            {formatPrice(variant.price)}
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function InventoryPage() {
  const { t } = useTranslation();
  const { data: products = [], isLoading } = useProducts();

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
        ) : (
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="w-10" />
                <TableHead className="font-bold py-5 text-foreground">{t("inventory.table.product_name")}</TableHead>
                <TableHead className="font-bold py-5 text-foreground">{t("inventory.table.variants")}</TableHead>
                <TableHead className="text-right font-bold py-5 text-foreground">{t("inventory.table.total_stock")}</TableHead>
                <TableHead className="text-right font-bold py-5 text-foreground">{t("inventory.table.price_range")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
