import { useState } from "react";
import { Plus, Loader2, Handshake, Trash2, Pencil, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { useProviders, useCreateProvider, useUpdateProvider, useDeleteProvider } from "@/hooks/useProviders";
import { domain } from "../../wailsjs/go/models";

const emptyForm = { name: "", phone: "", description: "" };

export default function ProvidersPage() {
  const { t } = useTranslation();
  const { data: providers = [], isLoading } = useProviders();
  const createProvider = useCreateProvider();
  const updateProvider = useUpdateProvider();
  const deleteProvider = useDeleteProvider();

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<domain.Provider | null>(null);
  const [deleting, setDeleting] = useState<domain.Provider | null>(null);

  const isPending = createProvider.isPending || updateProvider.isPending;

  const startEdit = (provider: domain.Provider) => {
    setEditing(provider);
    setForm({ name: provider.name, phone: provider.phone, description: provider.description });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editing) {
      updateProvider.mutate(new domain.Provider({ ...form, id: editing.id }), {
        onSuccess: cancelEdit,
      });
    } else {
      createProvider.mutate(new domain.Provider(form), {
        onSuccess: () => setForm(emptyForm),
      });
    }
  };

  const confirmDelete = () => {
    if (!deleting) return;
    deleteProvider.mutate(deleting.id, {
      onSuccess: () => {
        if (editing?.id === deleting.id) cancelEdit();
        setDeleting(null);
      },
    });
  };

  const labelClass = "text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1";
  const inputClass = "rounded-xl border-muted-foreground/20 focus:border-primary h-11";

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="pb-2 border-b">
        <h1 className="text-4xl font-extrabold tracking-tight">{t("provider.title")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {t("provider.page_description")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Creation / edit form */}
        <div className="md:col-span-1">
          <div className="p-6 rounded-3xl border bg-card shadow-xl space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              {editing ? (
                <Pencil className="w-5 h-5 text-primary" />
              ) : (
                <Plus className="w-5 h-5 text-primary" />
              )}
              {editing ? t("provider.edit_title") : t("provider.new_title")}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className={labelClass}>
                  {t("provider.name")}
                </Label>
                <Input
                  id="name"
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className={labelClass}>
                  {t("provider.phone")}
                </Label>
                <Input
                  id="phone"
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description" className={labelClass}>
                  {t("provider.description")}
                </Label>
                <Input
                  id="description"
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl h-11 shadow-lg shadow-primary/20"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editing ? t("common.save") : t("provider.create_button")}
              </Button>
              {editing && (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full rounded-xl h-11"
                  onClick={cancelEdit}
                >
                  {t("common.cancel")}
                </Button>
              )}
            </form>
          </div>
        </div>

        {/* List */}
        <div className="md:col-span-2">
          <div className="rounded-3xl border bg-card shadow-xl overflow-hidden">
            <div className="p-6 border-b bg-muted/30">
              <h2 className="text-xl font-bold">{t("provider.title")}</h2>
            </div>

            <div className="divide-y">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : providers.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Handshake className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  {t("inventory.empty.description")}
                </div>
              ) : (
                providers.map((provider: domain.Provider) => (
                  <div key={provider.id} className="p-6 flex items-center justify-between group hover:bg-accent/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Handshake className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold">{provider.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-3">
                          {provider.phone && (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {provider.phone}
                            </span>
                          )}
                          {provider.description && <span>{provider.description}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startEdit(provider)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleting(provider)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm: cascade destroys the provider's quotes, so unlike brands this needs a guard */}
      <Dialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{t("common.confirm_delete_title")} {deleting?.name}</DialogTitle>
            <DialogDescription>
              {t("provider.delete_confirm")} {t("common.confirm_delete_warning")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" className="rounded-xl" onClick={() => setDeleting(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              disabled={deleteProvider.isPending}
              onClick={confirmDelete}
            >
              {deleteProvider.isPending ? (
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
