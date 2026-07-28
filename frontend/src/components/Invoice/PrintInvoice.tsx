import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatPrice, formatDate } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/hooks/useSettings";
import { domain } from "../../../wailsjs/go/models";

interface PrintInvoiceProps {
  sale: domain.Sale | null;
  onClose: () => void;
}

export function PrintInvoice({ sale, onClose }: PrintInvoiceProps) {
  const { t } = useTranslation();
  const { data: settings } = useSettings();
  const storeName = settings?.store_name || "Mi Veterinaria";
  const isThermal = (settings?.print_format || "thermal") === "thermal";

  if (!sale) return null;
  const items = sale.items || [];

  return (
    <Dialog open={!!sale} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-lg rounded-3xl max-h-[90vh] overflow-y-auto">
        {/* @page can't be class-scoped, so the active format injects it */}
        <style>{isThermal ? "@page{size:80mm auto;margin:0}" : "@page{size:letter;margin:15mm}"}</style>
        <DialogHeader className="print:hidden">
          <DialogTitle>{t("invoice.number")}{sale.id}</DialogTitle>
          <DialogDescription>{formatDate(sale.createdAt)}</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border bg-neutral-100 dark:bg-neutral-800 p-4 overflow-x-auto">
          <div
            className={cn(
              "print-area bg-white text-black mx-auto shadow-sm",
              isThermal
                ? "w-[72mm] font-mono text-[11px] leading-tight p-3"
                : "w-full max-w-[180mm] text-sm p-8"
            )}
          >
            <div className="text-center space-y-0.5">
              <div className={isThermal ? "font-bold text-[13px] uppercase" : "font-bold text-2xl"}>
                {storeName}
              </div>
              <div>{t("invoice.number")}{sale.id}</div>
              <div>{t("invoice.date")}: {formatDate(sale.createdAt)}</div>
            </div>

            {isThermal ? (
              <>
                <div className="border-t border-dashed border-black my-2" />
                {items.map((item) => (
                  <div key={item.id} className="mb-1">
                    <div>{item.description}</div>
                    <div className="flex justify-between">
                      <span>{item.quantity} x {formatPrice(item.unitPrice)}</span>
                      <span>{formatPrice(item.quantity * item.unitPrice)}</span>
                    </div>
                  </div>
                ))}
                <div className="border-t border-dashed border-black my-2" />
                <div className="flex justify-between">
                  <span>{t("invoice.subtotal")}</span>
                  <span>{formatPrice(sale.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("invoice.vat")}</span>
                  <span>{formatPrice(sale.vatAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-[13px]">
                  <span>{t("invoice.total")}</span>
                  <span>{formatPrice(sale.total)}</span>
                </div>
                <div className="border-t border-dashed border-black my-2" />
                <div className="text-center">{t("invoice.thanks")}</div>
              </>
            ) : (
              <>
                <table className="w-full mt-6 border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black text-left">
                      <th className="py-2">{t("invoice.item")}</th>
                      <th className="py-2 text-right">{t("invoice.qty")}</th>
                      <th className="py-2 text-right">{t("invoice.price")}</th>
                      <th className="py-2 text-right">{t("invoice.total")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-neutral-300">
                        <td className="py-2">{item.description}</td>
                        <td className="py-2 text-right tabular-nums">{item.quantity}</td>
                        <td className="py-2 text-right tabular-nums">{formatPrice(item.unitPrice)}</td>
                        <td className="py-2 text-right tabular-nums">{formatPrice(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex flex-col items-end mt-4 space-y-1">
                  <div className="flex justify-between w-56">
                    <span>{t("invoice.subtotal")}</span>
                    <span className="tabular-nums">{formatPrice(sale.subtotal)}</span>
                  </div>
                  <div className="flex justify-between w-56">
                    <span>{t("invoice.vat")}</span>
                    <span className="tabular-nums">{formatPrice(sale.vatAmount)}</span>
                  </div>
                  <div className="flex justify-between w-56 font-bold text-base border-t border-black pt-1">
                    <span>{t("invoice.total")}</span>
                    <span className="tabular-nums">{formatPrice(sale.total)}</span>
                  </div>
                </div>
                <div className="text-center mt-8">{t("invoice.thanks")}</div>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="ghost" className="rounded-xl" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button className="rounded-xl shadow-lg shadow-primary/20" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            {t("invoice.print")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
