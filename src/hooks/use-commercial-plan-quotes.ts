"use client";

import { bffPost } from "@/lib/bff-client";
import type { BillingPeriod } from "@/lib/commercial-plan-display";
import type { components } from "@/types/schemas-payment";
import { useEffect, useState } from "react";

type CommercialPlanResponse = components["schemas"]["CommercialPlanResponse"];
type CommercialPlanQuoteResponse =
  components["schemas"]["CommercialPlanQuoteResponse"];

// Constante stable : un `{}` par défaut serait recréé à chaque rendu et
// relancerait l'effet (et donc les appels de devis) en boucle.
const NO_ADD_ONS: Record<string, string[]> = {};

export function useCommercialPlanQuotes(
  plans: CommercialPlanResponse[],
  billingPeriod: BillingPeriod,
  addOnCodesByPlan: Record<string, string[]> = NO_ADD_ONS,
) {
  const [quotes, setQuotes] = useState<
    Record<string, CommercialPlanQuoteResponse>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planCodes = plans
    .map((plan) => plan.code)
    .filter((code): code is string => Boolean(code))
    .join(",");
  const addOnsKey = JSON.stringify(addOnCodesByPlan);

  useEffect(() => {
    let cancelled = false;

    if (!planCodes) {
      const timer = globalThis.setTimeout(() => {
        if (!cancelled) {
          setQuotes({});
          setLoading(false);
          setError(null);
        }
      }, 0);
      return () => {
        cancelled = true;
        globalThis.clearTimeout(timer);
      };
    }

    const codes = planCodes.split(",");
    const timer = globalThis.setTimeout(() => {
      setLoading(true);
      setError(null);

      // allSettled : un devis en échec (réseau lent, plan indisponible) ne doit
      // pas masquer les prix des autres plans.
      void Promise.allSettled(
        codes.map(async (code) => {
          const quote = await bffPost<CommercialPlanQuoteResponse>(
            `/api/plans/${code}/quote`,
            {
              billingPeriod,
              addOnCodes: addOnCodesByPlan[code] ?? [],
            },
          );
          return [code, quote] as const;
        }),
      )
        .then((results) => {
          if (cancelled) return;
          const entries = results.flatMap((result) =>
            result.status === "fulfilled" ? [result.value] : [],
          );
          setQuotes(Object.fromEntries(entries));
          const firstFailure = results.find(
            (result): result is PromiseRejectedResult => result.status === "rejected",
          );
          setError(
            firstFailure
              ? firstFailure.reason instanceof Error
                ? firstFailure.reason.message
                : "Impossible de charger certains tarifs"
              : null,
          );
        })
        .finally(() => {
          if (!cancelled) {
            setLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
    // `addOnsKey` représente le contenu de addOnCodesByPlan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planCodes, billingPeriod, addOnsKey]);

  return { quotes, loading, error };
}
