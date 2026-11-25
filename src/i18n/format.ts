import type { Locale } from "@/i18n/locale-provider";

export const DEFAULT_CURRENCY = "XAF";

export function toIntlTag(locale: Locale): string {
  return locale === "en" ? "en-US" : "fr-FR";
}

/**
 * Formate un montant avec sa devise (ex. `12 500 FCFA`, `€12.50`).
 * Repli sur `<montant> <code>` si la devise n'est pas reconnue par Intl.
 */
export function formatMoney(
  amount: number | null | undefined,
  currency: string | null | undefined,
  intlTag: string,
): string {
  const value = amount ?? 0;
  const code = currency?.trim().toUpperCase() || DEFAULT_CURRENCY;
  try {
    return new Intl.NumberFormat(intlTag, {
      style: "currency",
      currency: code,
      maximumFractionDigits: code === "XAF" || code === "XOF" ? 0 : 2,
    }).format(value);
  } catch {
    return `${value.toLocaleString(intlTag)} ${code}`;
  }
}

/** Nombre de jours entiers entre maintenant et `date` (négatif si passé). */
export function daysUntil(date: string | null | undefined, now: number): number | null {
  if (!date) return null;
  const time = Date.parse(date);
  if (Number.isNaN(time)) return null;
  return Math.ceil((time - now) / 86_400_000);
}
