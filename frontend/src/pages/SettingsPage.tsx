import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import { useSettings, useSaveSettings } from "@/hooks/useSettings";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { data: settings, isLoading } = useSettings();
  const saveSettings = useSaveSettings();

  const [form, setForm] = useState({
    store_name: "",
    default_vat_rate: "19",
    default_margin_pct: "30",
    expiry_warning_days: "30",
    print_format: "thermal",
  });

  useEffect(() => {
    if (settings) setForm((f) => ({ ...f, ...settings }));
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings.mutate(form, {
      onSuccess: () => toast.success(t("settings.saved")),
    });
  };

  const labelClass = "text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1";
  const inputClass = "rounded-xl border-muted-foreground/20 focus:border-primary h-11";

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="pb-2 border-b">
        <h1 className="text-4xl font-extrabold tracking-tight">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-2 text-lg">{t("settings.description")}</p>
      </div>

      <div className="max-w-xl">
        <div className="p-6 rounded-3xl border bg-card shadow-xl">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-full rounded-xl" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="store_name" className={labelClass}>{t("settings.store_name")}</Label>
                <Input
                  id="store_name"
                  className={inputClass}
                  value={form.store_name}
                  onChange={(e) => setForm({ ...form, store_name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="default_vat" className={labelClass}>{t("settings.default_vat")}</Label>
                  <Select
                    value={form.default_vat_rate}
                    onValueChange={(val) => setForm({ ...form, default_vat_rate: val })}
                  >
                    <SelectTrigger id="default_vat" className="rounded-xl h-11 border-muted-foreground/20 shadow-none w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="19">19%</SelectItem>
                      <SelectItem value="5">5%</SelectItem>
                      <SelectItem value="0">0%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="default_margin" className={labelClass}>{t("settings.default_margin")}</Label>
                  <Input
                    id="default_margin"
                    type="number"
                    min="0"
                    step="1"
                    className={inputClass}
                    value={form.default_margin_pct}
                    onChange={(e) => setForm({ ...form, default_margin_pct: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="expiry_days" className={labelClass}>{t("settings.expiry_warning_days")}</Label>
                <Input
                  id="expiry_days"
                  type="number"
                  min="0"
                  step="1"
                  className={inputClass}
                  value={form.expiry_warning_days}
                  onChange={(e) => setForm({ ...form, expiry_warning_days: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground px-1">{t("settings.expiry_warning_hint")}</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="print_format" className={labelClass}>{t("settings.print_format")}</Label>
                <Select
                  value={form.print_format}
                  onValueChange={(val) => setForm({ ...form, print_format: val })}
                >
                  <SelectTrigger id="print_format" className="rounded-xl h-11 border-muted-foreground/20 shadow-none w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thermal">{t("settings.thermal")}</SelectItem>
                    <SelectItem value="letter">{t("settings.letter")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl h-11 shadow-lg shadow-primary/20"
                disabled={saveSettings.isPending}
              >
                {saveSettings.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {t("settings.save_button")}
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
