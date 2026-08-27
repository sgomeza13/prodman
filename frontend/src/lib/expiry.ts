/**
 * Vencimiento rules, shared by the inventory badges and the /expiring report so
 * the two can never disagree about what "por vencer" means. See CONTEXT.md.
 */

export type ExpiryState = "vigente" | "por_vencer" | "vencido";

/** Anything carrying stock and an optional vencimiento — domain.ItemVariant fits. */
export interface ExpiryInput {
  currentStock: number;
  expirationDate?: any;
}

const DAY_MS = 86_400_000;
const RANK: Record<ExpiryState, number> = { vigente: 0, por_vencer: 1, vencido: 2 };

/** The calendar date out of Go's RFC3339, as local midnight. Reading the string
 *  instead of the instant keeps "2026-09-15T00:00:00Z" from landing on the 14th
 *  in UTC-5. */
function localDay(date: string): number {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

function today(): number {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

/** Whole days from today until `date`. Negative once it has passed. */
export function daysUntilExpiry(date: string): number {
  return Math.round((localDay(date) - today()) / DAY_MS);
}

/**
 * A variant holding no stock is always vigente: its date describes goods that
 * already left the store. warningDays of 0 means no advance warning at all.
 */
export function expiryState(variant: ExpiryInput, warningDays: number): ExpiryState {
  if (!variant.expirationDate || variant.currentStock <= 0) return "vigente";
  const days = daysUntilExpiry(variant.expirationDate);
  if (days < 0) return "vencido";
  return days <= warningDays ? "por_vencer" : "vigente";
}

/** Worst state across a product's variants, carrying the soonest date that earned it. */
export function rollupExpiry(
  variants: ExpiryInput[],
  warningDays: number
): { state: ExpiryState; date: string | null } {
  let state: ExpiryState = "vigente";
  let date: string | null = null;
  for (const v of variants) {
    const s = expiryState(v, warningDays);
    if (s === "vigente") continue;
    if (RANK[s] > RANK[state] || (s === state && (date === null || v.expirationDate < date))) {
      state = s;
      date = v.expirationDate;
    }
  }
  return { state, date };
}

export function formatExpiryDate(date: string): string {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** RFC3339 → the yyyy-mm-dd an <input type="date"> expects, and back. */
export const toDateInput = (date?: any): string => (date ? String(date).slice(0, 10) : "");
export const fromDateInput = (value: string): string | null =>
  value ? `${value}T00:00:00Z` : null;

/** Cue colours per state, shared by every surface that shows one. */
export const EXPIRY_STYLES: Record<ExpiryState, string> = {
  vigente: "text-muted-foreground border-muted-foreground/20",
  por_vencer: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  vencido: "text-destructive border-destructive/30 bg-destructive/10",
};
