"use client";

import { ACTIVITY_SOURCE_ICONS } from "@/components/console/activity-icons";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toIntlTag } from "@/i18n/format";
import { useLocale } from "@/i18n/locale-provider";
import {
  formatActivityAmount,
  formatActivityDate,
  formatActivityStatusLabel,
  formatActivityType,
  getActivityStatusVariant,
  sortActivityItems,
  type PaymentActivityItem,
} from "@/lib/payment-activity";
import { ArrowRight, Inbox } from "lucide-react";
import Link from "next/link";

const RECENT_LIMIT = 5;

export function RecentActivity({
  activity,
  loading,
  error,
  hasWallet,
}: {
  activity: PaymentActivityItem[];
  loading: boolean;
  error: string | null;
  hasWallet: boolean;
}) {
  const { t, locale } = useLocale();
  const intlTag = toIntlTag(locale);
  const d = t.dashboard;
  const recent = sortActivityItems(activity).slice(0, RECENT_LIMIT);

  let emptyMessage: string | null = null;
  if (!hasWallet) emptyMessage = d.recentNoWallet;
  else if (error) emptyMessage = d.recentError;
  else if (recent.length === 0) emptyMessage = d.recentEmpty;

  return (
    <Card>
      <CardHeader className="yypay:flex yypay:flex-row yypay:items-start yypay:justify-between yypay:gap-3 yypay:space-y-0">
        <div>
          <CardTitle>{d.recentTitle}</CardTitle>
          <CardDescription>{d.recentDescription}</CardDescription>
        </div>
        {hasWallet && (
          <Link
            href="/console/transactions"
            className="yypay:inline-flex yypay:shrink-0 yypay:items-center yypay:gap-1 yypay:text-sm yypay:font-medium yypay:text-primary yypay:hover:underline"
          >
            {d.viewAll}
            <ArrowRight className="yypay:h-4 yypay:w-4" aria-hidden />
          </Link>
        )}
      </CardHeader>
      <CardContent>
        {loading && hasWallet ? (
          <div className="yypay:space-y-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="yypay:h-12 yypay:w-full" />
            ))}
          </div>
        ) : emptyMessage ? (
          <div className="yypay:flex yypay:flex-col yypay:items-center yypay:gap-2 yypay:py-8 yypay:text-center">
            <Inbox className="yypay:h-8 yypay:w-8 yypay:text-muted-foreground" aria-hidden />
            <p className="yypay:text-sm yypay:text-secondary">{emptyMessage}</p>
          </div>
        ) : (
          <ul className="yypay:divide-y yypay:divide-border">
            {recent.map((item) => {
              const Icon = ACTIVITY_SOURCE_ICONS[item.source];
              const { date, time } = formatActivityDate(item.createdAt, intlTag);
              return (
                <li
                  key={`${item.source}-${item.id}`}
                  className="yypay:flex yypay:items-center yypay:gap-3 yypay:py-3"
                >
                  <span className="yypay:flex yypay:h-9 yypay:w-9 yypay:shrink-0 yypay:items-center yypay:justify-center yypay:rounded-lg yypay:bg-muted yypay:text-muted-foreground">
                    <Icon className="yypay:h-4 yypay:w-4" aria-hidden />
                  </span>
                  <div className="yypay:min-w-0 yypay:flex-1">
                    <p className="yypay:truncate yypay:text-sm yypay:font-medium yypay:text-foreground">
                      {formatActivityType(item, t)}
                    </p>
                    <p className="yypay:text-xs yypay:text-secondary">
                      {date}
                      {time ? ` · ${time}` : ""}
                    </p>
                  </div>
                  <div className="yypay:flex yypay:flex-col yypay:items-end yypay:gap-1">
                    <span className="yypay:text-sm yypay:font-semibold yypay:tabular-nums yypay:text-foreground">
                      {formatActivityAmount(item, intlTag)}
                    </span>
                    <Badge variant={getActivityStatusVariant(item.status)}>
                      {formatActivityStatusLabel(item.status, t)}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
