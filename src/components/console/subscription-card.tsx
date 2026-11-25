"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { daysUntil, toIntlTag } from "@/i18n/format";
import { useLocale } from "@/i18n/locale-provider";
import { bffGet } from "@/lib/bff-client";
import {
  formatPaidUntil,
  getActiveSubscription,
  getActiveSubscriptionLabel,
} from "@/lib/plan-subscription";
import { cn } from "@/lib/utils";
import type { components } from "@/types/schemas-payment";
import { BadgeCheck, CalendarClock, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type SubscriptionResponse = components["schemas"]["SubscriptionResponse"];
type CommercialPlanResponse = components["schemas"]["CommercialPlanResponse"];

const EXPIRING_SOON_DAYS = 7;

type SubscriptionState = {
  loading: boolean;
  error: boolean;
  subscription: SubscriptionResponse | null;
  plans: CommercialPlanResponse[];
  /** Moment du chargement : référence des calculs de durée (rendu pur). */
  loadedAt: number;
};

/** Part de la période payée restante, entre 0 et 1. */
function remainingRatio(subscription: SubscriptionResponse, now: number) {
  const start = Date.parse(subscription.paidAt ?? "");
  const end = Date.parse(subscription.paidUntil ?? "");
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  return Math.min(1, Math.max(0, (end - now) / (end - start)));
}

export function SubscriptionCard({
  refreshKey = 0,
  className,
}: {
  refreshKey?: number;
  className?: string;
}) {
  const { t, locale } = useLocale();
  const intlTag = toIntlTag(locale);
  const [state, setState] = useState<SubscriptionState>({
    loading: true,
    error: false,
    subscription: null,
    plans: [],
    loadedAt: 0,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((previous) => ({ ...previous, loading: true, error: false }));
      try {
        const [subscriptions, plans] = await Promise.all([
          bffGet<SubscriptionResponse[]>("/api/plans/subscriptions"),
          bffGet<CommercialPlanResponse[]>("/api/plans"),
        ]);
        if (cancelled) return;
        const loadedAt = Date.now();
        setState({
          loadedAt,
          loading: false,
          error: false,
          subscription:
            getActiveSubscription(
              Array.isArray(subscriptions) ? subscriptions : [],
              loadedAt,
            ) ??
            null,
          plans: Array.isArray(plans) ? plans : [],
        });
      } catch {
        if (!cancelled) {
          setState({
            loading: false,
            error: true,
            subscription: null,
            plans: [],
            loadedAt: Date.now(),
          });
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (state.loading) {
    return <Skeleton className={cn("yypay:h-56 yypay:w-full yypay:rounded-xl", className)} />;
  }

  const { subscription } = state;
  const d = t.dashboard;

  if (!subscription) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="yypay:flex yypay:items-center yypay:gap-2">
            <Sparkles className="yypay:h-5 yypay:w-5 yypay:text-primary" aria-hidden />
            {d.subscriptionTitle}
          </CardTitle>
          <CardDescription>
            {state.error ? d.subscriptionError : d.subscriptionNone}
          </CardDescription>
        </CardHeader>
        <CardContent className="yypay:space-y-4">
          {!state.error && (
            <p className="yypay:text-sm yypay:text-secondary">
              {d.subscriptionNoneDescription}
            </p>
          )}
          <Button asChild>
            <Link href="/console/plans">{d.viewPlans}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const label = getActiveSubscriptionLabel(subscription, state.plans, t);
  const until = formatPaidUntil(subscription.paidUntil, intlTag);
  const days = daysUntil(subscription.paidUntil, state.loadedAt);
  const ratio = remainingRatio(subscription, state.loadedAt);
  const expiringSoon = days !== null && days <= EXPIRING_SOON_DAYS;

  return (
    <Card className={className}>
      <CardHeader className="yypay:flex yypay:flex-row yypay:items-start yypay:justify-between yypay:gap-3 yypay:space-y-0">
        <div className="yypay:min-w-0">
          <CardTitle className="yypay:flex yypay:items-center yypay:gap-2">
            <BadgeCheck className="yypay:h-5 yypay:w-5 yypay:text-primary" aria-hidden />
            {d.subscriptionTitle}
          </CardTitle>
          <CardDescription>{until ? d.subscriptionValidUntil(until) : null}</CardDescription>
        </div>
        <Badge variant={expiringSoon ? "destructive" : "success"}>
          {expiringSoon ? d.subscriptionExpiringSoon : d.subscriptionActive}
        </Badge>
      </CardHeader>
      <CardContent className="yypay:space-y-4">
        <p className="yypay:text-2xl yypay:font-bold yypay:tracking-tight yypay:text-foreground">
          {label}
        </p>

        {days !== null && (
          <div className="yypay:space-y-2">
            <p className="yypay:flex yypay:items-center yypay:gap-1.5 yypay:text-sm yypay:text-secondary">
              <CalendarClock className="yypay:h-4 yypay:w-4" aria-hidden />
              {d.subscriptionDaysLeft(days)}
            </p>
            {ratio !== null && (
              <div
                role="progressbar"
                aria-label={d.subscriptionDaysLeft(days)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(ratio * 100)}
                className="yypay:h-1.5 yypay:w-full yypay:overflow-hidden yypay:rounded-full yypay:bg-muted"
              >
                <div
                  className={cn(
                    "yypay:h-full yypay:rounded-full yypay:transition-[width]",
                    expiringSoon ? "yypay:bg-rose-500" : "yypay:bg-primary",
                  )}
                  style={{ width: `${Math.max(ratio * 100, 2)}%` }}
                />
              </div>
            )}
          </div>
        )}

        <Button asChild variant="outline" size="sm">
          <Link href="/console/plans">{d.changePlan}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
