import { useEffect, useRef, useState } from "react";
import { Plus, Loader2, Trash2, PackagePlus, Save, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { domain } from "../../../../wailsjs/go/models";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { cn, formatPrice } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useCreateProduct, useUpdateProduct, usePickProductImage } from "@/hooks/useProducts";
import { useBrands } from "@/hooks/useBrands";
import { useCategories } from "@/hooks/useCategories";
import { useProviders, useProviderPrices, useDeleteProviderPrice } from "@/hooks/useProviders";
import { useSettings } from "@/hooks/useSettings";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/** One provider's purchase price for a variant, ex-IVA */
interface QuoteForm {
  id: number; // 0 = not saved yet
  providerId: number;
  price: number;
  display: string;
}

interface VariantForm {
  id: number; // 0 = new variant
  sku: string;
  sizing: string;
  unit: string;
  currentStock: number;
  minStock: number;
  price: number;
  priceDisplay: string;
  costPrice: number;
  costDisplay: string;
  vatRate: number;
  primarySupplier: string;
  quotes: QuoteForm[];
}

interface AddItemModalProps {
  /** When set, the modal edits this product instead of creating a new one */
  product?: domain.Product;
  /** Controlled mode (edit); when omitted the modal renders its own trigger button */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function emptyVariant(defaultVat: number): VariantForm {
  return {
    id: 0, sku: "", sizing: "", unit: "", currentStock: 0, minStock: 10,
    price: 0, priceDisplay: "", costPrice: 0, costDisplay: "",
    vatRate: defaultVat, primarySupplier: "Unknown", quotes: [],
  };
}

/** Lowest quoted price, or 0 when nothing is quoted */
function cheapestQuote(quotes: QuoteForm[]): number {
  return quotes.reduce((min, q) => (min === 0 || q.price < min ? q.price : min), 0);
}

function variantToForm(v: domain.ItemVariant): VariantForm {
  return {
    id: v.id, sku: v.sku, sizing: v.sizing, unit: v.unit || "",
    currentStock: v.currentStock, minStock: v.minStock,
    price: v.price, priceDisplay: v.price > 0 ? formatPrice(v.price) : "",
    costPrice: v.costPrice, costDisplay: v.costPrice > 0 ? formatPrice(v.costPrice) : "",
    vatRate: v.vatRate, primarySupplier: v.primarySupplier || "Unknown", quotes: [],
  };
}

export function AddItemModal({ product, open, onOpenChange }: AddItemModalProps) {
  const { t } = useTranslation();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const pickImage = usePickProductImage();
  const { data: brands = [] } = useBrands();
  const { data: categories = [] } = useCategories();
  const { data: providers = [] } = useProviders();
  const { data: settings } = useSettings();
  const defaultVat = Number(settings?.default_vat_rate ?? 19);

  const isEdit = !!product;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;

  const { data: savedQuotes = [] } = useProviderPrices(product?.id ?? 0, isOpen && !!product);
  const deleteQuote = useDeleteProviderPrice(product?.id ?? 0);

  const [productData, setProductData] = useState({
    name: "",
    description: "",
    brandId: null as number | null,
    categoryId: null as number | null,
    imagePath: "",
  });

  const [variants, setVariants] = useState<VariantForm[]>([emptyVariant(defaultVat)]);
  const [removedVariantIds, setRemovedVariantIds] = useState<number[]>([]);
  // seed saved quotes once per opening: a background refetch must not wipe edits
  const quotesSeeded = useRef(false);

  // Prefill (edit) or reset (create) whenever the dialog opens
  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      setProductData({
        name: product.name,
        description: product.description,
        brandId: product.brandId ?? null,
        categoryId: product.categoryId ?? null,
        imagePath: product.imagePath || "",
      });
      setVariants((product.variants || []).map(variantToForm));
    } else {
      setProductData({ name: "", description: "", brandId: null, categoryId: null, imagePath: "" });
      setVariants([emptyVariant(defaultVat)]);
    }
    setRemovedVariantIds([]);
    quotesSeeded.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product]);

  // Provider quotes arrive after the prefill above, so fold them in when they land
  useEffect(() => {
    if (!isOpen || !product || quotesSeeded.current || savedQuotes.length === 0) return;
    quotesSeeded.current = true;
    setVariants((current) =>
      current.map((v) => ({
        ...v,
        quotes: savedQuotes
          .filter((q) => q.itemVariantId === v.id)
          .map((q) => ({ id: q.id, providerId: q.providerId, price: q.price, display: formatPrice(q.price) })),
      }))
    );
  }, [isOpen, product, savedQuotes]);

  const addVariant = () => {
    setVariants([...variants, emptyVariant(defaultVat)]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return;
    const removed = variants[index];
    if (removed.id > 0) {
      setRemovedVariantIds([...removedVariantIds, removed.id]);
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, patch: Partial<VariantForm>) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], ...patch };
    setVariants(newVariants);
  };

  const addQuote = (vi: number) =>
    updateVariant(vi, { quotes: [...variants[vi].quotes, { id: 0, providerId: 0, price: 0, display: "" }] });

  const updateQuote = (vi: number, qi: number, patch: Partial<QuoteForm>) =>
    updateVariant(vi, { quotes: variants[vi].quotes.map((q, i) => (i === qi ? { ...q, ...patch } : q)) });

  const removeQuote = (vi: number, qi: number) => {
    const quote = variants[vi].quotes[qi];
    // ponytail: saved quotes go immediately, same as the compare dialog — one re-typeable number
    if (quote.id > 0) deleteQuote.mutate(quote.id);
    updateVariant(vi, { quotes: variants[vi].quotes.filter((_, i) => i !== qi) });
  };

  const quoteMoneyProps = (vi: number, qi: number) => ({
    value: variants[vi].quotes[qi].display,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      updateQuote(vi, qi, { display: raw, price: parseFloat(raw.replace(/[^0-9.]/g, "")) || 0 });
    },
    onBlur: () => {
      const p = variants[vi].quotes[qi].price;
      if (p > 0) updateQuote(vi, qi, { display: formatPrice(p) });
    },
    onFocus: () => {
      const p = variants[vi].quotes[qi].price;
      updateQuote(vi, qi, { display: p > 0 ? p.toString() : "" });
    },
  });

  // Money-input idiom: raw digits while typing/focused, COP-formatted on blur
  const moneyProps = (index: number, valueField: "price" | "costPrice", displayField: "priceDisplay" | "costDisplay") => ({
    value: variants[index][displayField],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const numericValue = parseFloat(raw.replace(/[^0-9.]/g, "")) || 0;
      updateVariant(index, { [displayField]: raw, [valueField]: numericValue });
    },
    onBlur: () => {
      const v = variants[index][valueField];
      if (v > 0) updateVariant(index, { [displayField]: formatPrice(v) });
    },
    onFocus: () => {
      const v = variants[index][valueField];
      updateVariant(index, { [displayField]: v > 0 ? v.toString() : "" });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = new domain.Product({
      id: product?.id ?? 0,
      name: productData.name,
      description: productData.description,
      imagePath: productData.imagePath,
      brandId: productData.brandId,
      categoryId: productData.categoryId,
      variants: variants.map(v => {
        const quotes = v.quotes.filter((q) => q.providerId > 0 && q.price > 0);
        return new domain.ItemVariant({
          id: v.id,
          productId: product?.id ?? 0,
          sku: v.sku,
          sizing: v.sizing || "Standard",
          unit: v.unit,
          currentStock: Number(v.currentStock),
          minStock: Number(v.minStock),
          price: Number(v.price),
          // Cost left blank would report the first sales as 100% profit, so seed it
          // with the cheapest quote. Any purchase overwrites it with what was paid.
          costPrice: Number(v.costPrice) || cheapestQuote(quotes),
          vatRate: Number(v.vatRate),
          primarySupplier: v.primarySupplier,
          expirationDate: null,
          // itemVariantId is filled in on the Go side: a new variant has no ID yet
          quotes: quotes.map((q) => new domain.ProviderPrice({ providerId: q.providerId, price: q.price })),
        });
      })
    });

    if (isEdit) {
      updateProduct.mutate({ product: payload, removedVariantIds }, {
        onSuccess: () => setIsOpen(false),
      });
    } else {
      createProduct.mutate(payload, {
        onSuccess: () => setIsOpen(false),
      });
    }
  };

  const isPending = createProduct.isPending || updateProduct.isPending;
  const fieldLabel = "text-[10px] font-bold uppercase text-muted-foreground";
  const fieldInput = "rounded-lg h-9 text-sm";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          <Button className="rounded-full px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Plus className="w-4 h-4 mr-2" />
            {t("inventory.empty.button")}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-3xl border-none shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isEdit ? t("product.edit_title") : t("product.new_title")}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t("product.edit_description") : t("product.new_description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 pt-4">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              {t("product.general_info")}
            </h3>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("product.name")}</Label>
                  <Input
                    id="name"
                    placeholder={t("product.name_placeholder")}
                    className="rounded-xl border-muted-foreground/20 focus:border-primary transition-all h-11"
                    value={productData.name}
                    onChange={(e) => setProductData({ ...productData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid gap-2 w-full">
                  <Label htmlFor="brand" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    {t("product.brand")}
                  </Label>
                  <Select
                    value={productData.brandId?.toString() || ""}
                    onValueChange={(val) => setProductData({ ...productData, brandId: parseInt(val) })}
                  >
                    <SelectTrigger id="brand" className="rounded-xl h-11 border-muted-foreground/20 shadow-none focus:ring-primary">
                      <SelectValue placeholder={t("product.brand_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.length === 0 ? (
                        <div className="p-2 text-muted-foreground">{t("product.no_brands")}</div>
                      ) : (
                        brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id.toString()}>
                            {brand.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2 w-full">
                  <Label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    {t("product.category")}
                  </Label>
                  <Select
                    value={productData.categoryId?.toString() || ""}
                    onValueChange={(val) => setProductData({ ...productData, categoryId: parseInt(val) })}
                  >
                    <SelectTrigger id="category" className="rounded-xl h-11 border-muted-foreground/20 shadow-none focus:ring-primary">
                      <SelectValue placeholder={t("product.category_placeholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.length === 0 ? (
                        <div className="p-2 text-muted-foreground">{t("product.no_categories")}</div>
                      ) : (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("product.description")}</Label>
                  <Input
                    id="description"
                    placeholder={t("product.description_placeholder")}
                    className="rounded-xl border-muted-foreground/20 focus:border-primary transition-all h-11"
                    value={productData.description}
                    onChange={(e) => setProductData({ ...productData, description: e.target.value })}
                    type="text"
                  />
                </div>
              </div>

              {isEdit && (
                <div className="flex items-center gap-4">
                  {productData.imagePath && (
                    <img
                      src={productData.imagePath}
                      alt={productData.name}
                      className="w-16 h-16 rounded-xl object-cover border"
                    />
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    disabled={pickImage.isPending}
                    onClick={() => pickImage.mutate(product!.id, {
                      onSuccess: (path) => {
                        if (path) setProductData((p) => ({ ...p, imagePath: path }));
                      },
                    })}
                  >
                    {pickImage.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <ImagePlus className="w-4 h-4 mr-2" />
                    )}
                    {productData.imagePath ? t("product.change_image") : t("product.add_image")}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <div className="w-1 h-4 bg-primary rounded-full" />
                {t("product.variants_section")}
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
                className="rounded-full border-primary/20 hover:bg-primary/5 text-primary"
              >
                <Plus className="w-3 h-3 mr-1" /> {t("product.add_variant")}
              </Button>
            </div>

            <div className="space-y-4">
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="p-5 rounded-2xl border border-muted-foreground/10 bg-muted/30 relative group animate-in slide-in-from-top-2 duration-300"
                >
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeVariant(index)}
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="grid gap-1.5">
                      <Label className={fieldLabel}>{t("product.variant_fields.sku")}</Label>
                      <Input
                        placeholder="SKU-001"
                        className={fieldInput}
                        value={variant.sku}
                        onChange={(e) => updateVariant(index, { sku: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className={fieldLabel}>{t("product.variant_fields.sizing")}</Label>
                      <Input
                        placeholder="1kg, XL, etc."
                        className={fieldInput}
                        value={variant.sizing}
                        onChange={(e) => updateVariant(index, { sizing: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className={fieldLabel}>{t("product.variant_fields.unit")}</Label>
                      <Input
                        placeholder={t("product.variant_fields.unit_placeholder")}
                        className={fieldInput}
                        value={variant.unit}
                        onChange={(e) => updateVariant(index, { unit: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className={fieldLabel}>{t("product.variant_fields.vat_rate")}</Label>
                      <Select
                        value={variant.vatRate.toString()}
                        onValueChange={(val) => updateVariant(index, { vatRate: Number(val) })}
                      >
                        <SelectTrigger className="rounded-lg h-9 text-sm shadow-none w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="19">19%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="0">0%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label className={fieldLabel}>{t("product.variant_fields.stock")}</Label>
                      <Input
                        type="number"
                        min="0"
                        className={fieldInput}
                        value={variant.currentStock}
                        onChange={(e) => updateVariant(index, { currentStock: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className={fieldLabel}>{t("product.variant_fields.min_stock")}</Label>
                      <Input
                        type="number"
                        min="0"
                        className={fieldInput}
                        value={variant.minStock}
                        onChange={(e) => updateVariant(index, { minStock: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className={fieldLabel}>{t("product.variant_fields.cost")}</Label>
                      <Input
                        // shows what the blank field will fall back to
                        placeholder={cheapestQuote(variant.quotes) > 0 ? formatPrice(cheapestQuote(variant.quotes)) : "0"}
                        className={fieldInput}
                        {...moneyProps(index, "costPrice", "costDisplay")}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className={fieldLabel}>{t("product.variant_fields.price")}</Label>
                      <Input
                        placeholder="0"
                        className={fieldInput}
                        {...moneyProps(index, "price", "priceDisplay")}
                        required
                      />
                    </div>
                  </div>

                  {/* What each provider charges for THIS presentation, ex-IVA */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className={fieldLabel}>{t("product.quotes")}</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 rounded-lg text-xs"
                        disabled={providers.length === 0}
                        onClick={() => addQuote(index)}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {t("product.add_quote")}
                      </Button>
                    </div>

                    {providers.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{t("product.no_providers")}</p>
                    ) : variant.quotes.length === 0 ? (
                      <p className="text-xs text-muted-foreground">{t("product.no_quotes")}</p>
                    ) : (
                      variant.quotes.map((quote, qi) => (
                        <div key={qi} className="flex items-center gap-2">
                          <Select
                            value={quote.providerId ? String(quote.providerId) : ""}
                            onValueChange={(val) => updateQuote(index, qi, { providerId: Number(val) })}
                          >
                            <SelectTrigger className="rounded-lg h-9 text-sm shadow-none flex-1">
                              <SelectValue placeholder={t("product.provider_placeholder")} />
                            </SelectTrigger>
                            <SelectContent>
                              {/* a provider already quoted on this variant would just overwrite itself */}
                              {providers
                                .filter(
                                  (p) =>
                                    p.id === quote.providerId ||
                                    !variant.quotes.some((o) => o.providerId === p.id)
                                )
                                .map((p) => (
                                  <SelectItem key={p.id} value={String(p.id)}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="$ 0"
                            className={cn(fieldInput, "w-36 font-mono")}
                            {...quoteMoneyProps(index, qi)}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10 shrink-0"
                            onClick={() => removeQuote(index, qi)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsOpen(false)}
              className="rounded-xl px-6"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl px-8 min-w-[150px] shadow-lg shadow-primary/20"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("common.saving")}
                </>
              ) : isEdit ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t("product.save_button")}
                </>
              ) : (
                <>
                  <PackagePlus className="w-4 h-4 mr-2" />
                  {t("product.create_button")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
