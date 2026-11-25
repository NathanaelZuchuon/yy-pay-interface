"use client";

import type {
  CommercialPlanOrderResponse,
  CommercialPlanResponse,
  SessionContext,
  SubscriptionResponse,
} from "@/components/cart/cart-types";
import { toIntlTag } from "@/i18n/format";
import { useLocale } from "@/i18n/locale-provider";
import { bffGet } from "@/lib/bff-client";
import {
  buildPendingPaymentMessage,
  canPurchasePlan,
  getPendingPlanCodes,
} from "@/lib/plan-subscription";
import type { CartPlanItem } from "@/stores/cart-store";
import { useEffect, useState } from "react";

/**
 * Vérifie, à l'ouverture du panier, qu'aucun abonnement actif ni paiement
 * en attente n'empêche l'achat. Renvoie le message bloquant éventuel.
 */
export function usePurchaseGuard(
  open: boolean,
  items: CartPlanItem[],
  quoteSignature: string,
) {
  const { t, locale } = useLocale();
  const intlTag = toIntlTag(locale);
  const [purchaseBlockMessage, setPurchaseBlockMessage] = useState<string | null>(
    null,
  );
  const [guardLoading, setGuardLoading] = useState(false);

  useEffect(() => {
    if (!open || items.length === 0) {
      const timer = globalThis.setTimeout(() => {
        setPurchaseBlockMessage(null);
      }, 0);
      return () => globalThis.clearTimeout(timer);
    }

    let cancelled = false;
    const timer = globalThis.setTimeout(() => {
      setGuardLoading(true);
      void Promise.all([
        bffGet<SubscriptionResponse[]>("/api/plans/subscriptions"),
        bffGet<CommercialPlanResponse[]>("/api/plans"),
        bffGet<CommercialPlanOrderResponse[]>("/api/commercial-plans/orders"),
        bffGet<SessionContext>("/api/session/context"),
      ])
        .then(([subscriptions, plans, orders, session]) => {
          if (cancelled) return;

          const purchaseGuard = canPurchasePlan(
            Array.isArray(subscriptions) ? subscriptions : [],
            Array.isArray(plans) ? plans : [],
            t,
            intlTag,
          );
          if (!purchaseGuard.allowed) {
            setPurchaseBlockMessage(purchaseGuard.reason ?? null);
            return;
          }

          const pendingPlanCodes = getPendingPlanCodes(
            Array.isArray(orders) ? orders : [],
            session.organizationId,
          );
          const blockedItem = items.find(
            (item) => item.plan.code && pendingPlanCodes.has(item.plan.code),
          );
          if (blockedItem?.plan.code) {
            setPurchaseBlockMessage(
              buildPendingPaymentMessage(blockedItem.plan.code, t),
            );
            return;
          }

          setPurchaseBlockMessage(null);
        })
        .catch(() => {
          if (!cancelled) {
            setPurchaseBlockMessage(null);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setGuardLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, items, quoteSignature]);

  return { purchaseBlockMessage, guardLoading };
}
