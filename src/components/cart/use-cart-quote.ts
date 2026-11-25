"use client";

import type {
  AggregatedQuote,
  BillingPeriod,
  CommercialPlanQuoteResponse,
} from "@/components/cart/cart-types";
import { useLocale } from "@/i18n/locale-provider";
import { bffPost } from "@/lib/bff-client";
import type { CartPlanItem } from "@/stores/cart-store";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/**
 * Devis serveur du panier : un appel `/quote` par plan, agrégés en un total.
 * Recalculé à chaque changement de plans, d'add-ons ou de période.
 */
export function useCartQuote(
  open: boolean,
  items: CartPlanItem[],
  billingPeriod: BillingPeriod,
) {
  const { t } = useLocale();
  const [quote, setQuote] = useState<AggregatedQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const quoteSignature = useMemo(
    () =>
      items
        .map(
          (item) =>
            `${item.plan.code ?? ""}:${item.addOnCodes.slice().sort().join(",")}`,
        )
        .join("|"),
    [items],
  );

  useEffect(() => {
    if (!open || items.length === 0) {
      return;
    }

    let cancelled = false;
    const timer = globalThis.setTimeout(() => {
      setQuoteLoading(true);
      void Promise.all(
        items.map((item) => {
          const planCode = item.plan.code;
          if (!planCode) {
            return Promise.resolve(null);
          }
          return bffPost<CommercialPlanQuoteResponse>(
            `/api/plans/${planCode}/quote`,
            {
              billingPeriod,
              addOnCodes: item.addOnCodes,
            },
          );
        }),
      )
        .then((quotes) => {
          if (cancelled) return;

          const validQuotes = quotes.filter(
            (planQuote): planQuote is CommercialPlanQuoteResponse =>
              planQuote != null,
          );

          const lines = validQuotes.flatMap((planQuote) =>
            (planQuote.lines ?? []).map((line) => ({
              ...line,
              serviceCode: planQuote.plan?.code
                ? `${planQuote.plan.code}:${line.serviceCode ?? ""}`
                : line.serviceCode,
            })),
          );
          const total = validQuotes.reduce(
            (sum, planQuote) => sum + (planQuote.total ?? 0),
            0,
          );
          const currency =
            validQuotes.find((planQuote) => planQuote.currency)?.currency ??
            "XAF";

          setQuote({ billingPeriod, lines, total, currency });
        })
        .catch((error) => {
          if (!cancelled) {
            setQuote(null);
            toast.error(error instanceof Error ? error.message : t.cart.quoteError);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setQuoteLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items, quoteSignature, billingPeriod]);

  // Panier fermé ou vidé : on oublie le devis précédent.
  useEffect(() => {
    if (!open || items.length === 0) {
      const timer = globalThis.setTimeout(() => setQuote(null), 0);
      return () => globalThis.clearTimeout(timer);
    }
  }, [open, items.length]);

  return { quote, quoteLoading, quoteSignature };
}
