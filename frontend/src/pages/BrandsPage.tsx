import { useState } from "react";
import { Plus, Loader2, Store, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "react-i18next";
import { useBrands, useCreateBrand, useDeleteBrand } from "@/hooks/useBrands";
import { domain } from "../../wailsjs/go/models";

export default function BrandsPage() {
  const { t } = useTranslation();
  const { data: brands = [], isLoading } = useBrands();
  const createBrand = useCreateBrand();
  const deleteBrand = useDeleteBrand();
  
  const [newBrand, setNewBrand] = useState({ name: "", description: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.name.trim()) return;

    createBrand.mutate(new domain.Brand(newBrand), {
      onSuccess: () => {
        setNewBrand({ name: "", description: "" });
      }
    });
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="pb-2 border-b">
        <h1 className="text-4xl font-extrabold tracking-tight">{t("brand.title")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Manage your product manufacturers and brands.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Creation Form */}
        <div className="md:col-span-1">
          <div className="p-6 rounded-3xl border bg-card shadow-xl space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              {t("brand.new_title")}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  {t("brand.name")}
                </Label>
                <Input 
                  id="name" 
                  className="rounded-xl border-muted-foreground/20 focus:border-primary h-11"
                  value={newBrand.name} 
                  onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })} 
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                  {t("brand.description")}
                </Label>
                <Input 
                  id="description" 
                  className="rounded-xl border-muted-foreground/20 focus:border-primary h-11"
                  value={newBrand.description} 
                  onChange={(e) => setNewBrand({ ...newBrand, description: e.target.value })} 
                />
              </div>
              <Button 
                type="submit" 
                className="w-full rounded-xl h-11 shadow-lg shadow-primary/20"
                disabled={createBrand.isPending}
              >
                {createBrand.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : t("brand.create_button")}
              </Button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="md:col-span-2">
          <div className="rounded-3xl border bg-card shadow-xl overflow-hidden">
            <div className="p-6 border-b bg-muted/30">
              <h2 className="text-xl font-bold">{t("brand.title")}</h2>
            </div>
            
            <div className="divide-y">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : brands.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Store className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  {t("inventory.empty.description")}
                </div>
              ) : (
                brands.map((brand: domain.Brand) => (
                  <div key={brand.id} className="p-6 flex items-center justify-between group hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Store className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold">{brand.name}</div>
                        <div className="text-sm text-muted-foreground">{brand.description}</div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteBrand.mutate(brand.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
