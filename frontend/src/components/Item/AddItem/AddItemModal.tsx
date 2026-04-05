import { useState } from "react";
import { Plus, Loader2, Trash2, PackagePlus } from "lucide-react";
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
import { formatPrice } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useCreateProduct } from "@/hooks/useProducts";

interface VariantForm {
  sku: string;
  sizing: string;
  currentStock: number;
  price: number;
  priceDisplay: string;
}

export function AddItemModal() {
  const { t } = useTranslation();
  const createProduct = useCreateProduct();
  const [isOpen, setIsOpen] = useState(false);
  
  const [productData, setProductData] = useState({
    name: "",
    description: "",
  });

  const [variants, setVariants] = useState<VariantForm[]>([
    { sku: "", sizing: "", currentStock: 0, price: 0, priceDisplay: "" }
  ]);

  const addVariant = () => {
    setVariants([...variants, { sku: "", sizing: "", currentStock: 0, price: 0, priceDisplay: "" }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) return;
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantForm, value: string | number) => {
    const newVariants = [...variants];
    
    if (field === 'priceDisplay') {
      const stringValue = String(value);
      const numericString = stringValue.replace(/[^0-9.]/g, '');
      const numericValue = parseFloat(numericString) || 0;
      
      newVariants[index] = { 
        ...newVariants[index], 
        priceDisplay: stringValue,
        price: numericValue
      };
    } else {
      newVariants[index] = { ...newVariants[index], [field]: value };
    }
    
    setVariants(newVariants);
  };

  const handlePriceBlur = (index: number) => {
    const newVariants = [...variants];
    const variant = newVariants[index];
    if (variant.price > 0) {
      newVariants[index].priceDisplay = formatPrice(variant.price);
    }
    setVariants(newVariants);
  };

  const handlePriceFocus = (index: number) => {
    const newVariants = [...variants];
    const variant = newVariants[index];
    newVariants[index].priceDisplay = variant.price > 0 ? variant.price.toString() : "";
    setVariants(newVariants);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newProduct = new domain.Product({
      name: productData.name,
      description: productData.description,
      categoryId: null,
      variants: variants.map(v => new domain.ItemVariant({
        sku: v.sku,
        sizing: v.sizing || "Standard",
        currentStock: Number(v.currentStock),
        price: Number(v.price),
        primarySupplier: "Unknown",
        expirationDate: null,
      }))
    });

    createProduct.mutate(newProduct, {
      onSuccess: () => {
        setIsOpen(false);
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setProductData({ name: "", description: "" });
    setVariants([{ sku: "", sizing: "", currentStock: 0, price: 0, priceDisplay: "" }]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="rounded-full px-6 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
          <Plus className="w-4 h-4 mr-2" />
          {t("inventory.empty.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl border-none shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{t("product.new_title")}</DialogTitle>
          <DialogDescription>
            {t("product.new_description")}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-8 pt-4">
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              {t("product.general_info")}
            </h3>
            <div className="grid gap-4">
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
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">{t("product.description")}</Label>
                <Input 
                  id="description" 
                  placeholder={t("product.description_placeholder")}
                  className="rounded-xl border-muted-foreground/20 focus:border-primary transition-all h-11"
                  value={productData.description} 
                  onChange={(e) => setProductData({ ...productData, description: e.target.value })} 
                />
              </div>
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
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t("product.variant_fields.sku")}</Label>
                      <Input 
                        placeholder="SKU-001"
                        className="rounded-lg h-9 text-sm"
                        value={variant.sku} 
                        onChange={(e) => updateVariant(index, 'sku', e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t("product.variant_fields.sizing")}</Label>
                      <Input 
                        placeholder="1kg, XL, etc."
                        className="rounded-lg h-9 text-sm"
                        value={variant.sizing} 
                        onChange={(e) => updateVariant(index, 'sizing', e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t("product.variant_fields.stock")}</Label>
                      <Input 
                        type="number"
                        className="rounded-lg h-9 text-sm"
                        value={variant.currentStock} 
                        onChange={(e) => updateVariant(index, 'currentStock', Number(e.target.value))} 
                        required 
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label className="text-[10px] font-bold uppercase text-muted-foreground">{t("product.variant_fields.price")}</Label>
                      <Input 
                        placeholder="0"
                        className="rounded-lg h-9 text-sm"
                        value={variant.priceDisplay} 
                        onChange={(e) => updateVariant(index, 'priceDisplay', e.target.value)}
                        onBlur={() => handlePriceBlur(index)}
                        onFocus={() => handlePriceFocus(index)}
                        required 
                      />
                    </div>
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
              disabled={createProduct.isPending} 
              className="rounded-xl px-8 min-w-[150px] shadow-lg shadow-primary/20"
            >
              {createProduct.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("common.saving")}
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
