import { useMemo, useState } from "react";
import { Loader2, Search, ShoppingCart, Trash2, Package, Banknote } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatPrice } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useProducts } from "@/hooks/useProducts";
import { useCreateSale } from "@/hooks/useSales";
import { PrintInvoice } from "@/components/Invoice/PrintInvoice";
import { domain } from "../../wailsjs/go/models";

interface SellableVariant {
  variantId: number;
  description: string;
  sku: string;
  unitPrice: number;
  costPrice: number;
  vatRate: number;
  stock: number;
  unit: string;
  imagePath: string;
}

interface CartItem extends SellableVariant {
  quantity: number;
}

export default function PosPage() {
  const { t } = useTranslation();
  const { data: products = [] } = useProducts();
  const createSale = useCreateSale();

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastSale, setLastSale] = useState<domain.Sale | null>(null);

  const sellables: SellableVariant[] = useMemo(
    () =>
      products.flatMap((p) =>
        (p.variants || []).map((v) => ({
          variantId: v.id,
          description: `${p.name} ${v.sizing}`.trim(),
          sku: v.sku,
          unitPrice: v.price,
          costPrice: v.costPrice,
          vatRate: v.vatRate,
          stock: v.currentStock,
          unit: v.unit,
          imagePath: p.imagePath,
        }))
      ),
    [products]
  );

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sellables.slice(0, 12);
    return sellables
      .filter((s) => s.description.toLowerCase().includes(q) || s.sku.toLowerCase().includes(q))
      .slice(0, 12);
  }, [sellables, search]);

  const addToCart = (item: SellableVariant) => {
    if (item.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.variantId === item.variantId);
      if (existing) {
        if (existing.quantity >= item.stock) return prev;
        return prev.map((c) =>
          c.variantId === item.variantId ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const setQuantity = (variantId: number, quantity: number) => {
    setCart((prev) =>
      prev.map((c) =>
        c.variantId === variantId
          ? { ...c, quantity: Math.max(1, Math.min(quantity, c.stock)) }
          : c
      )
    );
  };

  const removeFromCart = (variantId: number) => {
    setCart((prev) => prev.filter((c) => c.variantId !== variantId));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.quantity * c.unitPrice, 0);
  const vatAmount = cart.reduce((sum, c) => sum + c.quantity * c.unitPrice * c.vatRate / 100, 0);
  const total = Math.round(subtotal + vatAmount);

  const confirmSale = () => {
    if (cart.length === 0) return;
    const sale = new domain.Sale({
      items: cart.map((c) => new domain.SaleItem({
        variantId: c.variantId,
        description: c.description,
        quantity: Number(c.quantity),
        unitPrice: c.unitPrice,
        costPrice: c.costPrice,
        vatRate: c.vatRate,
      })),
    });
    createSale.mutate(sale, {
      onSuccess: (created) => {
        toast.success(t("pos.sale_done"));
        setCart([]);
        setLastSale(created);
      },
    });
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 h-screen flex flex-col">
      <div className="pb-2 border-b shrink-0">
        <h1 className="text-4xl font-extrabold tracking-tight">{t("pos.title")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{t("pos.description")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 flex-1 min-h-0 pb-8">
        {/* Product search */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              autoFocus
              placeholder={t("pos.search_placeholder")}
              className="rounded-xl border-muted-foreground/20 focus:border-primary h-12 pl-9 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="rounded-2xl border bg-card shadow-xl divide-y overflow-y-auto flex-1">
            {results.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">{t("pos.no_results")}</div>
            ) : (
              results.map((item) => {
                const outOfStock = item.stock <= 0;
                return (
                  <button
                    key={item.variantId}
                    type="button"
                    disabled={outOfStock}
                    onClick={() => addToCart(item)}
                    className={cn(
                      "w-full text-left p-4 flex items-center justify-between gap-4 transition-colors",
                      outOfStock ? "opacity-50 cursor-not-allowed" : "hover:bg-accent/40 active:bg-accent/60"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.imagePath ? (
                        <img src={item.imagePath} alt="" loading="lazy" className="w-10 h-10 rounded-lg object-cover border shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Package className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium truncate">{item.description}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{item.sku}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold tabular-nums">{formatPrice(item.unitPrice)}</div>
                      <div className={cn("text-xs", outOfStock ? "text-destructive font-bold" : "text-muted-foreground")}>
                        {outOfStock ? t("pos.out_of_stock") : `${t("pos.available")} ${item.stock}${item.unit ? ` ${item.unit}` : ""}`}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          <div className="rounded-3xl border bg-card shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="p-5 border-b bg-muted/30 flex items-center gap-2 shrink-0">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">{t("pos.cart_title")}</h2>
            </div>

            <div className="flex-1 overflow-y-auto divide-y min-h-0">
              {cart.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  {t("pos.cart_empty")}
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.variantId} className="p-4 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.description}</div>
                      <div className="text-xs font-mono text-muted-foreground">
                        {formatPrice(item.unitPrice)}
                      </div>
                    </div>
                    <Input
                      type="number"
                      min="1"
                      max={item.stock}
                      className="w-16 h-9 rounded-lg text-center tabular-nums"
                      value={item.quantity}
                      onChange={(e) => setQuantity(item.variantId, Number(e.target.value))}
                    />
                    <div className="w-24 text-right font-mono font-medium tabular-nums text-sm">
                      {formatPrice(item.quantity * item.unitPrice)}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10 shrink-0"
                      onClick={() => removeFromCart(item.variantId)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="p-5 border-t bg-muted/30 space-y-2 shrink-0">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("invoice.subtotal")}</span>
                <span className="font-mono tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("invoice.vat")}</span>
                <span className="font-mono tabular-nums">{formatPrice(vatAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>{t("invoice.total")}</span>
                <span className="font-mono tabular-nums">{formatPrice(total)}</span>
              </div>
              <Button
                className="w-full rounded-xl h-12 text-base shadow-lg shadow-primary/20 mt-2"
                disabled={cart.length === 0 || createSale.isPending}
                onClick={confirmSale}
              >
                {createSale.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t("pos.processing")}
                  </>
                ) : (
                  <>
                    <Banknote className="w-5 h-5 mr-2" />
                    {t("pos.confirm")}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <PrintInvoice sale={lastSale} onClose={() => setLastSale(null)} />
    </div>
  );
}
