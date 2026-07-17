"use client";

import { PlansGrid } from "@/components/console/plans-grid";
import { TransactionList } from "@/components/console/transaction-list";
import { WalletCard } from "@/components/console/wallet-card";
import { ConsoleHeader } from "@/components/layout/console-header";
import { bffPost } from "@/lib/bff-client";
import {
  BUNDLE_ORDER_STORAGE_KEY,
  COMMERCIAL_PLAN_ORDER_STORAGE_KEY,
  RECHARGE_ORDER_STORAGE_KEY,
} from "@/lib/bundle-constants";
import type { components } from "@/types/schemas-payment";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type WalletResponse = components["schemas"]["WalletResponse"];
type CommercialPlanOrderResponse =
  components["schemas"]["CommercialPlanOrderResponse"];
type ServiceBundleOrderResponse =
  components["schemas"]["ServiceBundleOrderResponse"];
type WalletRechargeOrderResponse =
  components["schemas"]["WalletRechargeOrderResponse"];

export default function ConsolePageClient() {
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get("payment") === "success";
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  useEffect(() => {
    const commercialPlanOrderId = sessionStorage.getItem(
      COMMERCIAL_PLAN_ORDER_STORAGE_KEY,
    );
    const bundleOrderId = sessionStorage.getItem(BUNDLE_ORDER_STORAGE_KEY);
    const rechargeOrderId = sessionStorage.getItem(RECHARGE_ORDER_STORAGE_KEY);

    if (
      !paymentSuccess &&
      !commercialPlanOrderId &&
      !bundleOrderId &&
      !rechargeOrderId
    ) {
      return;
    }

    let cancelled = false;

    async function refreshPendingOrders() {
      if (rechargeOrderId) {
        try {
          const order = await bffPost<WalletRechargeOrderResponse>(
            `/api/payments/wallets/recharge-orders/${rechargeOrderId}/refresh`,
          );

          if (cancelled) return;

          sessionStorage.removeItem(RECHARGE_ORDER_STORAGE_KEY);

          if (order.status === "RECHARGED") {
            toast.success("Recharge confirmée. Votre wallet a été crédité.");
          } else if (
            order.status === "FAILED" ||
            order.status === "CANCELLED"
          ) {
            toast.error("La recharge a échoué ou a été annulée.");
          } else {
            toast.success("Paiement reçu. Traitement de la recharge en cours…");
          }

          handleRefresh();
        } catch (error) {
          if (!cancelled) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Impossible de confirmer la recharge",
            );
          }
        }
      }

      const planOrderId = commercialPlanOrderId ?? bundleOrderId;
      if (!planOrderId) {
        if (!cancelled && paymentSuccess && !rechargeOrderId) {
          toast.success("Paiement reçu. Mise à jour en cours…");
          handleRefresh();
        }
        return;
      }

      try {
        if (commercialPlanOrderId) {
          const order = await bffPost<CommercialPlanOrderResponse>(
            `/api/commercial-plans/orders/${commercialPlanOrderId}/refresh`,
          );

          if (cancelled) return;

          sessionStorage.removeItem(COMMERCIAL_PLAN_ORDER_STORAGE_KEY);

          if (order.status === "ACTIVE") {
            toast.success("Paiement confirmé. Votre plan est activé.");
          } else if (order.status === "FAILED" || order.status === "CANCELLED") {
            toast.error("Le paiement a échoué ou a été annulé.");
          } else {
            toast.success("Paiement reçu. Traitement en cours…");
          }
        } else {
          const order = await bffPost<ServiceBundleOrderResponse>(
            `/api/service-bundles/orders/${planOrderId}/refresh`,
          );

          if (cancelled) return;

          sessionStorage.removeItem(BUNDLE_ORDER_STORAGE_KEY);

          if (order.status === "ACTIVE") {
            toast.success("Paiement confirmé. Vos services sont activés.");
          } else if (order.status === "FAILED" || order.status === "CANCELLED") {
            toast.error("Le paiement a échoué ou a été annulé.");
          } else {
            toast.success("Paiement reçu. Traitement en cours…");
          }
        }

        handleRefresh();
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Impossible de confirmer le paiement",
          );
        }
      }
    }

    void refreshPendingOrders();

    return () => {
      cancelled = true;
    };
  }, [paymentSuccess, handleRefresh]);

  const dataKey = `${refreshKey}-${paymentSuccess ? "success" : "idle"}`;

  return (
    <div className="yypay:flex yypay:min-h-full yypay:flex-col yypay:bg-surface">
      <ConsoleHeader title="Console" onCheckoutComplete={handleRefresh} />
      <main className="yypay:mx-auto yypay:w-full yypay:max-w-6xl yypay:flex-1 yypay:px-4 yypay:py-8 sm:yypay:px-6">
        <div className="yypay:mb-8">
          <h1 className="yypay:text-2xl yypay:font-bold yypay:text-navy sm:yypay:text-3xl">
            Tableau de bord
          </h1>
          <p className="yypay:mt-2 yypay:text-secondary">
            Gérez votre wallet, consultez vos transactions et souscrivez à des plans.
          </p>
        </div>

        <div
          key={dataKey}
          className="yypay:grid yypay:grid-cols-1 yypay:gap-6 lg:yypay:grid-cols-3"
        >
          <div className="yypay:lg:col-span-1">
            <WalletCard onWalletChange={setWallet} />
          </div>
          <div className="yypay:lg:col-span-2">
            <TransactionList walletId={wallet?.id} />
          </div>
        </div>

        <section className="yypay:mt-10">
          <h2 className="yypay:mb-4 yypay:text-xl yypay:font-semibold yypay:text-navy">
            Plans disponibles
          </h2>
          <PlansGrid key={`plans-${dataKey}`} />
        </section>
      </main>
    </div>
  );
}
