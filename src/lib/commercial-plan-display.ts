import { formatMoney } from "@/i18n/format";
import type { Messages } from "@/i18n/messages/fr";
import type { components } from "@/types/schemas-payment";

type CommercialPlanResponse = components["schemas"]["CommercialPlanResponse"];

export type BillingPeriod = "MONTHLY" | "YEARLY";

function lookup(table: object, code: string): string | undefined {
  return (table as Record<string, string | undefined>)[code];
}

/**
 * Repli lisible pour un code technique inconnu :
 * `INVENTORY_OPERATIONS_ADDON` → « Inventory operations ».
 */
export function humanizeCode(code: string): string {
  const words = code
    .replace(/_ADDON$/, "")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.toLowerCase());
  if (words.length === 0) return code;
  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

export function getPlanLabel(plan: CommercialPlanResponse, t: Messages): string {
  return plan.displayName?.trim() || plan.code || t.plans.defaultPlanFallback;
}

/** Description traduite du plan si elle est connue, sinon celle de l'API. */
export function getPlanDescription(
  plan: CommercialPlanResponse,
  t: Messages,
): string | null {
  const translated = plan.code ? lookup(t.plans.descriptions, plan.code) : undefined;
  return translated ?? (plan.description?.trim() || null);
}

function targetTypeKey(
  targetType: string,
): keyof Messages["plans"]["targetTypes"] | undefined {
  switch (targetType) {
    case "ORGANIZATION":
      return "organization";
    case "ENTERPRISE":
      return "enterprise";
    case "SMB":
      return "smb";
    default:
      return undefined;
  }
}

export function getTargetTypeLabel(
  targetType: string | null | undefined,
  t: Messages,
): string | null {
  const trimmed = targetType?.trim();
  // « BOTH » (tous publics) n'apporte rien à l'utilisateur : pas de badge.
  if (!trimmed || trimmed === "BOTH") {
    return null;
  }
  const key = targetTypeKey(trimmed);
  return key ? t.plans.targetTypes[key] : humanizeCode(trimmed);
}

export function formatBillingPeriodLabel(
  period: BillingPeriod,
  t: Messages,
): string {
  return period === "MONTHLY" ? t.plans.billingPeriod.monthly : t.plans.billingPeriod.yearly;
}

/** Nom lisible d'une option (add-on). */
export function formatAddOnLabel(code: string, t: Messages): string {
  return lookup(t.plans.addOns, code) ?? humanizeCode(code);
}

/** Nom lisible d'un module, d'un pack ou d'une option. */
export function formatFeatureLabel(code: string, t: Messages): string {
  return (
    lookup(t.plans.services, code) ??
    lookup(t.plans.packs, code) ??
    lookup(t.plans.addOns, code) ??
    humanizeCode(code)
  );
}

export function getPlanFeatures(plan: CommercialPlanResponse, t: Messages): string[] {
  const codes = [...(plan.packCodes ?? []), ...(plan.serviceCodes ?? [])];
  // Deux codes peuvent partager un libellé (ex. HR / HRM) : on dédoublonne.
  return [...new Set(codes.map((code) => formatFeatureLabel(code, t)))];
}

/** Prix d'un plan, séparé en montant et période pour la mise en page. */
export function formatPlanPrice(
  total: number | null | undefined,
  currency: string | null | undefined,
  billingPeriod: BillingPeriod,
  t: Messages,
  intlTag: string,
): { amount: string; period: string } | null {
  if (total == null) {
    return null;
  }
  return {
    amount: formatMoney(total, currency, intlTag),
    period:
      billingPeriod === "YEARLY" ? t.plans.card.perYearShort : t.plans.card.perMonthShort,
  };
}

export function formatQuotedPrice(
  total: number | null | undefined,
  currency: string | null | undefined,
  billingPeriod: BillingPeriod | undefined,
  t: Messages,
  intlTag: string,
): string | null {
  if (total == null) {
    return null;
  }
  const suffix = billingPeriod === "YEARLY" ? t.plans.perYear : t.plans.perMonth;
  return `${formatMoney(total, currency, intlTag)}${suffix}`;
}

export function formatYearlyMonthlyEquivalent(
  total: number | null | undefined,
  currency: string | null | undefined,
  t: Messages,
  intlTag: string,
): string | null {
  if (total == null) {
    return null;
  }
  return t.plans.yearlyMonthlyEquivalent(
    formatMoney(Math.round(total / 12), currency, intlTag),
  );
}

/**
 * Économie de la facturation annuelle par rapport à 12 mois au tarif mensuel.
 * `null` si l'un des prix manque ou si l'annuel n'est pas moins cher.
 */
export function computeYearlySavings(
  monthlyTotal: number | null | undefined,
  yearlyTotal: number | null | undefined,
): { amount: number; percent: number } | null {
  if (monthlyTotal == null || yearlyTotal == null || monthlyTotal <= 0) {
    return null;
  }
  const twelveMonths = monthlyTotal * 12;
  const amount = twelveMonths - yearlyTotal;
  if (amount <= 0) {
    return null;
  }
  return { amount, percent: Math.round((amount / twelveMonths) * 100) };
}

export function getPopularPlanCode(
  plans: CommercialPlanResponse[],
): string | null {
  const preferred = plans.find((plan) => plan.code === "COMMERCE");
  if (preferred?.code) {
    return preferred.code;
  }

  if (plans.length >= 2) {
    const middleIndex = Math.floor(plans.length / 2);
    return plans[middleIndex]?.code ?? null;
  }

  return plans[0]?.code ?? null;
}
