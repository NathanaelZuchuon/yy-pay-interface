"use client";

import { useCommercialPlanQuotes } from "@/hooks/use-commercial-plan-quotes";
import {
  computeYearlySavings,
  type BillingPeriod,
} from "@/lib/commercial-plan-display";
import type { components } from "@/types/schemas-payment";
import { useMemo } from "react";

type CommercialPlanResponse = components["schemas"]["CommercialPlanResponse"];

export type PlanSavings = { amount: number; percent: number; currency?: string };

/**
 * Devis des plans pour les deux périodes de facturation, afin d'afficher
 * l'économie réelle de l'annuel. Seule l'API de devis existante est utilisée.
 */
export function usePlanPricing(
  plans: CommercialPlanResponse[],
  billingPeriod: BillingPeriod,
) {
  const monthly = useCommercialPlanQuotes(plans, "MONTHLY");
  const yearly = useCommercialPlanQuotes(plans, "YEARLY");

  const savingsByPlan = useMemo(() => {
    const result: Record<string, PlanSavings> = {};
    for (const [code, yearlyQuote] of Object.entries(yearly.quotes)) {
      const savings = computeYearlySavings(
        monthly.quotes[code]?.total,
        yearlyQuote.total,
      );
      if (savings) {
        result[code] = { ...savings, currency: yearlyQuote.currency };
      }
    }
    return result;
  }, [monthly.quotes, yearly.quotes]);

  const maxSavingsPercent = Object.values(savingsByPlan).reduce(
    (max, savings) => Math.max(max, savings.percent),
    0,
  );

  const current = billingPeriod === "YEARLY" ? yearly : monthly;

  return {
    quotes: current.quotes,
    quotesLoading: current.loading,
    savingsByPlan,
    maxSavingsPercent,
  };
}
