import { CalendarClock, CalendarX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { EXPIRY_STYLES, formatExpiryDate, type ExpiryState } from "@/lib/expiry";

export const expiryIcon = (state: ExpiryState) => (state === "vencido" ? CalendarX : CalendarClock);

/** Read-only vencimiento cue. Renders nothing for vigente — no news is no badge. */
export function ExpiryBadge({
  state,
  date,
  className,
}: {
  state: ExpiryState;
  date?: string | null;
  className?: string;
}) {
  const { t } = useTranslation();
  if (state === "vigente" || !date) return null;
  const Icon = expiryIcon(state);

  return (
    <span
      title={t(`expiry.${state}`)}
      className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 border whitespace-nowrap",
        EXPIRY_STYLES[state],
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {formatExpiryDate(date)}
    </span>
  );
}
