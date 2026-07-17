"use client";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { bffGet } from "@/lib/bff-client";
import type { components } from "@/types/schemas-payment";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type TransactionResponse = components["schemas"]["TransactionResponse"];

type TransactionListProps = {
  walletId?: string | null;
};

export function TransactionList({ walletId }: TransactionListProps) {
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!walletId) {
        setTransactions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await bffGet<TransactionResponse[]>(
          `/api/payments/wallets/${walletId}/transactions`,
        );
        setTransactions(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Impossible de charger les transactions",
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [walletId]);

  if (loading) {
    return <Skeleton className="yypay:h-64 yypay:w-full" />;
  }

  if (!walletId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Créez un wallet pour voir l&apos;historique.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des transactions</CardTitle>
        <CardDescription>{transactions.length} transaction(s)</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="yypay:text-sm yypay:text-secondary">
            Aucune transaction pour le moment.
          </p>
        ) : (
          <>
            <div className="yypay:hidden yypay:overflow-x-auto md:yypay:block">
              <table className="yypay:w-full yypay:text-left yypay:text-sm">
                <thead>
                  <tr className="yypay:border-b yypay:border-border yypay:text-secondary">
                    <th className="yypay:py-2 yypay:pr-4">Date</th>
                    <th className="yypay:py-2 yypay:pr-4">Type</th>
                    <th className="yypay:py-2 yypay:pr-4">Montant</th>
                    <th className="yypay:py-2 yypay:pr-4">Statut</th>
                    <th className="yypay:py-2">Réf.</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="yypay:border-b yypay:border-border/60">
                      <td className="yypay:py-3 yypay:pr-4">
                        {tx.createdAt
                          ? new Date(tx.createdAt).toLocaleString("fr-FR")
                          : "-"}
                      </td>
                      <td className="yypay:py-3 yypay:pr-4">{tx.type}</td>
                      <td className="yypay:py-3 yypay:pr-4 yypay:font-medium">
                        {tx.amount}
                      </td>
                      <td className="yypay:py-3 yypay:pr-4">
                        <Badge variant="secondary">{tx.status}</Badge>
                      </td>
                      <td className="yypay:py-3">{tx.reference}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="yypay:space-y-3 md:yypay:hidden">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="yypay:rounded-lg yypay:border yypay:border-border yypay:p-4"
                >
                  <div className="yypay:flex yypay:items-center yypay:justify-between">
                    <p className="yypay:font-medium yypay:text-navy">{tx.type}</p>
                    <Badge variant="secondary">{tx.status}</Badge>
                  </div>
                  <p className="yypay:mt-1 yypay:text-lg yypay:font-bold">
                    {tx.amount}
                  </p>
                  <p className="yypay:mt-1 yypay:text-xs yypay:text-secondary">
                    {tx.createdAt
                      ? new Date(tx.createdAt).toLocaleString("fr-FR")
                      : "-"}
                  </p>
                  <p className="yypay:mt-1 yypay:text-xs yypay:text-secondary">
                    {tx.reference}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
