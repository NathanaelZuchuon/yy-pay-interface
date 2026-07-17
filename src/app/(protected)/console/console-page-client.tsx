"use client";

import { PlansGrid } from "@/components/console/plans-grid";
import { TransactionList } from "@/components/console/transaction-list";
import { WalletCard } from "@/components/console/wallet-card";
import { ConsoleHeader } from "@/components/layout/console-header";
import type { components } from "@/types/schemas-payment";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

type WalletResponse = components["schemas"]["WalletResponse"];

export default function ConsolePageClient() {
  const searchParams = useSearchParams();
  const paymentSuccess = searchParams.get("payment") === "success";
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (paymentSuccess) {
      toast.success("Paiement reçu. Mise à jour en cours…");
    }
  }, [paymentSuccess]);

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
