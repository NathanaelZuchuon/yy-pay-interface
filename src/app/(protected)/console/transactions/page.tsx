"use client";

import { useConsoleData } from "@/components/console/console-data-provider";
import { TransactionList } from "@/components/console/transaction-list";

export default function TransactionsPage() {
  const { wallet } = useConsoleData();

  return (
    <>
      <div className="yypay:mb-8">
        <h1 className="yypay:text-2xl yypay:font-bold yypay:text-foreground sm:yypay:text-3xl">
          Transactions
        </h1>
        <p className="yypay:mt-2 yypay:text-muted-foreground">
          Historique des opérations de votre wallet : recharges, paiements,
          plans et bundles.
        </p>
      </div>
      <TransactionList walletId={wallet?.id} walletName={wallet?.ownerName} />
    </>
  );
}
