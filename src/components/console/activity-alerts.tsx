"use client";

import { useLocale } from "@/i18n/locale-provider";
import {
  getActivityStatusGroup,
  type PaymentActivityItem,
} from "@/lib/payment-activity";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";

const FAILED_WINDOW_MS = 30 * 86_400_000;

export function ActivityAlerts({
  activity,
  now,
}: {
  activity: PaymentActivityItem[];
  /** Référence temporelle (moment du chargement), pour garder le rendu pur. */
  now: number;
}) {
  const { t } = useLocale();
  const d = t.dashboard;

  let pending = 0;
  let recentFailed = 0;
  for (const item of activity) {
    const group = getActivityStatusGroup(item.status);
    if (group === "pending") {
      pending += 1;
    } else if (group === "failed") {
      const createdAt = Date.parse(item.createdAt ?? "");
      if (!Number.isNaN(createdAt) && now - createdAt <= FAILED_WINDOW_MS) {
        recentFailed += 1;
      }
    }
  }

  const alerts = [
    recentFailed > 0 && {
      key: "failed",
      tone: "danger" as const,
      icon: AlertTriangle,
      title: d.alertFailed(recentFailed),
      hint: d.alertFailedHint,
      href: "/console/transactions?status=failed",
    },
    pending > 0 && {
      key: "pending",
      tone: "warning" as const,
      icon: Clock,
      title: d.alertPending(pending),
      hint: d.alertPendingHint,
      href: "/console/transactions?status=pending",
    },
  ].filter(Boolean) as {
    key: string;
    tone: "danger" | "warning";
    icon: typeof Clock;
    title: string;
    hint: string;
    href: string;
  }[];

  if (alerts.length === 0) return null;

  return (
    <section aria-label={d.alertsLabel} className="yypay:grid yypay:gap-3 yypay:md:grid-cols-2">
      {alerts.map((alert) => {
        const Icon = alert.icon;
        return (
          <div
            key={alert.key}
            role="status"
            className={cn(
              "yypay:flex yypay:items-start yypay:gap-3 yypay:rounded-xl yypay:border yypay:p-4",
              alert.tone === "danger"
                ? "yypay:border-rose-200 yypay:bg-rose-50 yypay:dark:border-rose-500/30 yypay:dark:bg-rose-500/10"
                : "yypay:border-amber-200 yypay:bg-amber-50 yypay:dark:border-amber-500/30 yypay:dark:bg-amber-500/10",
            )}
          >
            <Icon
              aria-hidden
              className={cn(
                "yypay:mt-0.5 yypay:h-5 yypay:w-5 yypay:shrink-0",
                alert.tone === "danger"
                  ? "yypay:text-rose-600 yypay:dark:text-rose-300"
                  : "yypay:text-amber-600 yypay:dark:text-amber-300",
              )}
            />
            <div className="yypay:min-w-0 yypay:flex-1">
              <p className="yypay:text-sm yypay:font-semibold yypay:text-foreground">
                {alert.title}
              </p>
              <p className="yypay:mt-0.5 yypay:text-sm yypay:text-secondary">{alert.hint}</p>
            </div>
            <Link
              href={alert.href}
              className="yypay:inline-flex yypay:shrink-0 yypay:items-center yypay:gap-1 yypay:self-center yypay:text-sm yypay:font-medium yypay:text-primary yypay:hover:underline"
            >
              {d.review}
              <ArrowRight className="yypay:h-4 yypay:w-4" aria-hidden />
            </Link>
          </div>
        );
      })}
    </section>
  );
}
