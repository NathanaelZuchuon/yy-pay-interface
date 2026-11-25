"use client";

import { bffGet } from "@/lib/bff-client";
import type { PaymentActivityItem } from "@/lib/payment-activity";
import { useEffect, useState } from "react";

type PaymentActivityState = {
  activity: PaymentActivityItem[];
  loading: boolean;
  error: string | null;
  /** Horodatage du dernier chargement (référence pour les calculs « il y a N jours »). */
  fetchedAt: number;
};

/**
 * Historique consolidé du wallet (transactions, recharges, paiements, plans, bundles).
 * Partagé par le tableau de bord et la page Transactions.
 */
export function usePaymentActivity(
  walletId: string | null | undefined,
  { limit = 100, refreshKey = 0 }: { limit?: number; refreshKey?: number } = {},
): PaymentActivityState {
  const [state, setState] = useState<PaymentActivityState>({
    activity: [],
    loading: true,
    error: null,
    fetchedAt: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!walletId) {
        setState({ activity: [], loading: false, error: null, fetchedAt: Date.now() });
        return;
      }
      setState((previous) => ({ ...previous, loading: true, error: null }));
      try {
        const data = await bffGet<PaymentActivityItem[]>(
          `/api/payments/activity?walletId=${encodeURIComponent(walletId)}&limit=${limit}`,
        );
        if (!cancelled) {
          setState({
            activity: Array.isArray(data) ? data : [],
            loading: false,
            error: null,
            fetchedAt: Date.now(),
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            activity: [],
            loading: false,
            error: error instanceof Error ? error.message : String(error),
            fetchedAt: Date.now(),
          });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [walletId, limit, refreshKey]);

  return state;
}
