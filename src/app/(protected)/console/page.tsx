"use client";

import { WalletCard } from "@/components/console/wallet-card";

export default function ConsoleOverviewPage() {
  return (
    <>
      <div className="yypay:mb-8">
        <h1 className="yypay:text-2xl yypay:font-bold yypay:text-foreground sm:yypay:text-3xl">
          Tableau de bord
        </h1>
        <p className="yypay:mt-2 yypay:text-muted-foreground">
          Gérez votre wallet et consultez son solde.
        </p>
      </div>
      <div className="yypay:max-w-xl">
        <WalletCard />
      </div>
    </>
  );
}
