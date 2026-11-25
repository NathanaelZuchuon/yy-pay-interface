"use client";

import { ActivityAlerts } from "@/components/console/activity-alerts";
import { useConsoleData } from "@/components/console/console-data-provider";
import { RecentActivity } from "@/components/console/recent-activity";
import { SubscriptionCard } from "@/components/console/subscription-card";
import { WalletCard } from "@/components/console/wallet-card";
import { usePaymentActivity } from "@/hooks/use-payment-activity";
import { useLocale } from "@/i18n/locale-provider";

export default function ConsoleOverviewPage() {
  const { t } = useLocale();
  const { wallet, walletLoading, refreshKey } = useConsoleData();
  const { activity, loading, error, fetchedAt } = usePaymentActivity(wallet?.id, {
    refreshKey,
  });

  return (
    <>
      <div className="yypay:mb-8">
        <h1 className="yypay:text-2xl yypay:font-bold yypay:text-foreground yypay:sm:text-3xl">
          {t.pages.overview.title}
        </h1>
        <p className="yypay:mt-2 yypay:text-muted-foreground">
          {t.pages.overview.description}
        </p>
      </div>

      <div className="yypay:space-y-6">
        {!loading && <ActivityAlerts activity={activity} now={fetchedAt} />}

        <div className="yypay:grid yypay:gap-6 yypay:lg:grid-cols-2">
          <WalletCard className="yypay:h-full" />
          <SubscriptionCard refreshKey={refreshKey} className="yypay:h-full" />
        </div>

        <RecentActivity
          activity={activity}
          loading={loading || walletLoading}
          error={error}
          hasWallet={walletLoading || Boolean(wallet?.id)}
        />
      </div>
    </>
  );
}
