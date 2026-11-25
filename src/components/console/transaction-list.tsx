"use client";

import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { ACTIVITY_SOURCE_ICONS as SOURCE_ICONS } from "@/components/console/activity-icons";
import { usePaymentActivity } from "@/hooks/use-payment-activity";
import { toIntlTag } from "@/i18n/format";
import { useLocale } from "@/i18n/locale-provider";
import {
    countActivityByStatus,
    formatActivityAmount,
    formatActivityDate,
    formatActivityStatusLabel,
    formatActivityType,
    getActivityStatusGroup,
    getActivityStatusVariant,
    type ActivityStatusGroup,
} from "@/lib/payment-activity";
import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type TransactionListProps = {
  walletId?: string | null;
  walletName?: string | null;
};

type StatusFilter = "all" | ActivityStatusGroup;

const URL_STATUS_FILTERS = new Set<string>(["success", "pending", "failed"]);

function parseStatusFilter(value: string | null): StatusFilter {
  return value && URL_STATUS_FILTERS.has(value)
    ? (value as StatusFilter)
    : "all";
}

export function TransactionList({ walletId, walletName }: TransactionListProps) {
  const { t, locale } = useLocale();
  const intlTag = toIntlTag(locale);
  const { activity, loading, error } = usePaymentActivity(walletId);
  // Le filtre de statut vit dans l'URL (?status=) pour être partagé avec
  // les « filtres rapides » de la sidebar.
  const searchParams = useSearchParams();
  const statusFilter = parseStatusFilter(searchParams.get("status"));

  function setStatusFilter(next: StatusFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("status");
    } else {
      params.set("status", next);
    }
    const query = params.toString();
    globalThis.history.replaceState(
      null,
      "",
      query ? `?${query}` : globalThis.location.pathname,
    );
  }
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (error) {
      toast.error(error || t.transactionList.loadError);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const stats = useMemo(() => countActivityByStatus(activity), [activity]);

  const normalizedSearch = search.trim().toLowerCase();

  const filteredActivity = useMemo(() => {
    return activity.filter((item) => {
      if (
        statusFilter !== "all" &&
        getActivityStatusGroup(item.status) !== statusFilter
      ) {
        return false;
      }
      if (!normalizedSearch) return true;
      const haystack = [
        formatActivityType(item, t),
        item.detail,
        item.reference,
        item.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity, statusFilter, normalizedSearch, locale]);

  const walletLabel = walletName?.trim() || t.wallet.defaultName;
  const hasFiltersApplied = statusFilter !== "all" || normalizedSearch.length > 0;

  const statusTabs: { value: StatusFilter; label: string }[] = [
    { value: "all", label: t.transactionList.statusTabs.all },
    { value: "success", label: t.transactionList.statusTabs.success },
    { value: "pending", label: t.transactionList.statusTabs.pending },
    { value: "failed", label: t.transactionList.statusTabs.failed },
  ];

  function resetFilters() {
    setStatusFilter("all");
    setSearch("");
  }

  if (loading) {
    return (
      <div className="yypay:space-y-4">
        <Skeleton className="yypay:h-20 yypay:w-full" />
        <Skeleton className="yypay:h-96 yypay:w-full" />
      </div>
    );
  }

  if (!walletId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.transactionList.noWalletTitle}</CardTitle>
          <CardDescription>{t.transactionList.noWalletDescription}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="yypay:space-y-6">
      <div className="yypay:grid yypay:grid-cols-2 yypay:gap-3 yypay:sm:grid-cols-4">
        <Card>
          <CardContent className="yypay:p-4">
            <p className="yypay:text-xs yypay:font-medium yypay:text-muted-foreground">
              {t.transactionList.stats.total}
            </p>
            <p className="yypay:mt-1 yypay:text-2xl yypay:font-bold yypay:text-foreground">
              {activity.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="yypay:p-4">
            <p className="yypay:text-xs yypay:font-medium yypay:text-muted-foreground">
              {t.transactionList.stats.success}
            </p>
            <p className="yypay:mt-1 yypay:text-2xl yypay:font-bold yypay:text-emerald-600 yypay:dark:text-emerald-400">
              {stats.success}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="yypay:p-4">
            <p className="yypay:text-xs yypay:font-medium yypay:text-muted-foreground">
              {t.transactionList.stats.pending}
            </p>
            <p className="yypay:mt-1 yypay:text-2xl yypay:font-bold yypay:text-foreground">
              {stats.pending}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="yypay:p-4">
            <p className="yypay:text-xs yypay:font-medium yypay:text-muted-foreground">
              {t.transactionList.stats.failed}
            </p>
            <p className="yypay:mt-1 yypay:text-2xl yypay:font-bold yypay:text-rose-600 yypay:dark:text-rose-400">
              {stats.failed}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="yypay:gap-4">
          <div>
            <CardTitle>{t.transactionList.historyTitle(walletLabel)}</CardTitle>
            <CardDescription>
              {t.transactionList.summary(filteredActivity.length, activity.length)}
            </CardDescription>
          </div>

          <div className="yypay:flex yypay:flex-col yypay:gap-3 yypay:sm:flex-row yypay:sm:items-center yypay:sm:justify-between">
            <Tabs
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
              className="yypay:gap-0"
            >
              <TabsList className="yypay:w-full yypay:sm:w-auto">
                {statusTabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="yypay:relative yypay:sm:w-64">
              <Search className="yypay:pointer-events-none yypay:absolute yypay:left-3 yypay:top-1/2 yypay:h-4 yypay:w-4 yypay:-translate-y-1/2 yypay:text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.transactionList.searchPlaceholder}
                className="yypay:pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <p className="yypay:text-sm yypay:text-secondary">
              {t.transactionList.emptyAll}
            </p>
          ) : filteredActivity.length === 0 ? (
            <div className="yypay:flex yypay:flex-col yypay:items-center yypay:gap-3 yypay:py-10 yypay:text-center">
              <p className="yypay:text-sm yypay:text-secondary">
                {t.transactionList.emptyFiltered}
              </p>
              {hasFiltersApplied && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="yypay:text-sm yypay:font-medium yypay:text-primary yypay:hover:underline"
                >
                  {t.transactionList.resetFilters}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="yypay:hidden yypay:overflow-x-auto yypay:md:block">
                <table className="yypay:w-full yypay:text-left yypay:text-sm">
                  <thead>
                    <tr className="yypay:border-b yypay:border-border yypay:text-secondary">
                      <th className="yypay:py-2 yypay:pr-4">{t.transactionList.table.type}</th>
                      <th className="yypay:py-2 yypay:pr-4">{t.transactionList.table.date}</th>
                      <th className="yypay:py-2 yypay:pr-4">{t.transactionList.table.amount}</th>
                      <th className="yypay:py-2 yypay:pr-4">{t.transactionList.table.status}</th>
                      <th className="yypay:py-2">{t.transactionList.table.detail}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivity.map((item) => {
                      const Icon = SOURCE_ICONS[item.source];
                      const { date, time } = formatActivityDate(item.createdAt, intlTag);
                      return (
                        <tr
                          key={item.id}
                          className="yypay:border-b yypay:border-border/60 yypay:hover:bg-muted/40"
                        >
                          <td className="yypay:py-3 yypay:pr-4">
                            <div className="yypay:flex yypay:items-center yypay:gap-2 yypay:font-medium yypay:text-foreground">
                              <span className="yypay:flex yypay:h-8 yypay:w-8 yypay:shrink-0 yypay:items-center yypay:justify-center yypay:rounded-lg yypay:bg-muted yypay:text-muted-foreground">
                                <Icon className="yypay:h-4 yypay:w-4" />
                              </span>
                              {formatActivityType(item, t)}
                            </div>
                          </td>
                          <td className="yypay:py-3 yypay:pr-4 yypay:whitespace-nowrap">
                            <div>{date}</div>
                            <div className="yypay:text-xs yypay:text-secondary">{time}</div>
                          </td>
                          <td className="yypay:py-3 yypay:pr-4 yypay:font-medium">
                            {formatActivityAmount(item, intlTag)}
                          </td>
                          <td className="yypay:py-3 yypay:pr-4">
                            <Badge variant={getActivityStatusVariant(item.status)}>
                              {formatActivityStatusLabel(item.status, t)}
                            </Badge>
                          </td>
                          <td className="yypay:py-3 yypay:max-w-xs yypay:truncate yypay:text-secondary">
                            {item.detail ?? item.reference ?? "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="yypay:space-y-3 yypay:md:hidden">
                {filteredActivity.map((item) => {
                  const Icon = SOURCE_ICONS[item.source];
                  const { date, time } = formatActivityDate(item.createdAt, intlTag);
                  return (
                    <div
                      key={item.id}
                      className="yypay:rounded-lg yypay:border yypay:border-border yypay:p-4"
                    >
                      <div className="yypay:flex yypay:items-start yypay:justify-between yypay:gap-3">
                        <div className="yypay:flex yypay:items-center yypay:gap-2">
                          <span className="yypay:flex yypay:h-8 yypay:w-8 yypay:shrink-0 yypay:items-center yypay:justify-center yypay:rounded-lg yypay:bg-muted yypay:text-muted-foreground">
                            <Icon className="yypay:h-4 yypay:w-4" />
                          </span>
                          <p className="yypay:font-medium yypay:text-foreground">
                            {formatActivityType(item, t)}
                          </p>
                        </div>
                        <Badge variant={getActivityStatusVariant(item.status)}>
                          {formatActivityStatusLabel(item.status, t)}
                        </Badge>
                      </div>
                      <p className="yypay:mt-3 yypay:text-lg yypay:font-bold">
                        {formatActivityAmount(item, intlTag)}
                      </p>
                      <p className="yypay:mt-1 yypay:text-xs yypay:text-secondary">
                        {date} - {time}
                      </p>
                      <p className="yypay:mt-1 yypay:truncate yypay:text-xs yypay:text-secondary">
                        {item.detail ?? item.reference ?? "-"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
