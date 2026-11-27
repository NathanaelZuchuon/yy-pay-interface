"use client";

import { PlanAutoRenewalToggle } from "@/components/plans/plan-auto-renewal-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlanSavings } from "@/hooks/use-plan-pricing";
import { formatMoney, toIntlTag } from "@/i18n/format";
import { useLocale } from "@/i18n/locale-provider";
import {
  formatAddOnLabel,
  formatBillingPeriodLabel,
  formatPlanPrice,
  formatYearlyMonthlyEquivalent,
  getPlanDescription,
  getPlanFeatures,
  getPlanLabel,
  getTargetTypeLabel,
  type BillingPeriod,
} from "@/lib/commercial-plan-display";
import {
  formatPaidUntil,
  isSubscriptionStillValid,
} from "@/lib/plan-subscription";
import { cn } from "@/lib/utils";
import type { components } from "@/types/schemas-payment";
import { Check, ChevronDown, ChevronUp, Plus, Sparkles } from "lucide-react";
import { useState } from "react";

type CommercialPlanResponse = components["schemas"]["CommercialPlanResponse"];
type CommercialPlanQuoteResponse =
  components["schemas"]["CommercialPlanQuoteResponse"];
type SubscriptionResponse = components["schemas"]["SubscriptionResponse"];
type AutoRenewalResponse = components["schemas"]["AutoRenewalResponse"];

const VISIBLE_FEATURES = 6;

type PlanPricingCardProps = {
  plan: CommercialPlanResponse;
  quote?: CommercialPlanQuoteResponse | null;
  quoteLoading?: boolean;
  billingPeriod: BillingPeriod;
  savings?: PlanSavings;
  highlighted?: boolean;
  activeSubscription?: SubscriptionResponse | null;
  autoRenewal?: AutoRenewalResponse | null;
  autoRenewalLoading?: boolean;
  autoRenewalMutating?: boolean;
  onEnableAutoRenewal?: () => void | Promise<void>;
  onDisableAutoRenewal?: () => void | Promise<void>;
  inCart?: boolean;
  isPendingPayment?: boolean;
  purchaseBlocked?: boolean;
  blockMessage?: string;
  ctaLabel?: string;
  onSelect?: () => void;
  disabled?: boolean;
};

export function PlanPricingCard({
  plan,
  quote,
  quoteLoading = false,
  billingPeriod,
  savings,
  highlighted = false,
  activeSubscription = null,
  autoRenewal = null,
  autoRenewalLoading = false,
  autoRenewalMutating = false,
  onEnableAutoRenewal,
  onDisableAutoRenewal,
  inCart = false,
  isPendingPayment = false,
  purchaseBlocked = false,
  blockMessage,
  ctaLabel,
  onSelect,
  disabled = false,
}: PlanPricingCardProps) {
  const { t, locale } = useLocale();
  const intlTag = toIntlTag(locale);
  const [expanded, setExpanded] = useState(false);
  const planCode = plan.code ?? "";
  const description = getPlanDescription(plan, t);
  const targetLabel = getTargetTypeLabel(plan.targetType, t);
  const features = getPlanFeatures(plan, t);
  const addOns = plan.compatibleAddOnCodes ?? [];
  const visibleFeatures = expanded ? features : features.slice(0, VISIBLE_FEATURES);
  const hiddenCount = features.length - VISIBLE_FEATURES;
  const price = formatPlanPrice(quote?.total, quote?.currency, billingPeriod, t, intlTag);
  const yearlyNote =
    billingPeriod === "YEARLY"
      ? formatYearlyMonthlyEquivalent(quote?.total, quote?.currency, t, intlTag)
      : null;
  const savingsNote =
    billingPeriod === "YEARLY" && savings
      ? t.plans.card.yearlySavings(formatMoney(savings.amount, savings.currency, intlTag))
      : null;

  const isActivePlan = Boolean(
    activeSubscription &&
      activeSubscription.planCode === planCode &&
      isSubscriptionStillValid(activeSubscription),
  );

  const paidUntilLabel = formatPaidUntil(activeSubscription?.paidUntil, intlTag);

  const ctaDisabled =
    disabled ||
    purchaseBlocked ||
    isActivePlan ||
    inCart ||
    isPendingPayment ||
    quoteLoading ||
    !price ||
    !onSelect;

  let ctaText = ctaLabel ?? t.plans.section.selectCta;
  if (isActivePlan) {
    ctaText = paidUntilLabel
      ? t.plans.card.activeUntil(paidUntilLabel)
      : t.plans.card.activePlan;
  } else if (isPendingPayment) {
    ctaText = t.plans.card.paymentInProgress;
  } else if (inCart) {
    ctaText = t.plans.card.inCart;
  } else if (quoteLoading) {
    ctaText = t.plans.card.calculatingPrice;
  } else if (!price) {
    ctaText = t.plans.card.quoteUnavailable;
  }

  return (
    <article
      aria-label={getPlanLabel(plan, t)}
      className={cn(
        "yypay:relative yypay:flex yypay:h-full yypay:flex-col yypay:rounded-2xl yypay:border yypay:bg-card yypay:p-6 yypay:transition-all yypay:duration-200 yypay:sm:p-7",
        highlighted
          ? "yypay:border-primary yypay:shadow-popular"
          : "yypay:border-border yypay:shadow-card yypay:hover:-translate-y-0.5 yypay:hover:shadow-card-hover",
        isActivePlan && "yypay:ring-2 yypay:ring-emerald-500/40",
      )}
    >
      {highlighted && (
        <span className="yypay:absolute yypay:-top-3 yypay:left-6 yypay:inline-flex yypay:items-center yypay:gap-1 yypay:rounded-full yypay:bg-primary yypay:px-3 yypay:py-1 yypay:text-xs yypay:font-semibold yypay:text-primary-foreground yypay:shadow-sm">
          <Sparkles className="yypay:h-3.5 yypay:w-3.5" aria-hidden />
          {t.plans.card.recommended}
        </span>
      )}

      <header className="yypay:space-y-2">
        <div className="yypay:flex yypay:flex-wrap yypay:items-center yypay:gap-2">
          <h3 className="yypay:text-xl yypay:font-bold yypay:tracking-tight yypay:text-foreground">
            {getPlanLabel(plan, t)}
          </h3>
          {targetLabel && <Badge variant="secondary">{targetLabel}</Badge>}
          {isActivePlan && <Badge variant="success">{t.plans.card.active}</Badge>}
          {isPendingPayment && (
            <Badge variant="secondary">{t.plans.card.paymentInProgress}</Badge>
          )}
        </div>
        <p className="yypay:min-h-10 yypay:text-sm yypay:leading-relaxed yypay:text-muted-foreground">
          {description ?? t.plans.card.planFallback(planCode)}
        </p>
      </header>

      <div className="yypay:mt-6 yypay:min-h-[5.5rem]">
        {quoteLoading ? (
          <Skeleton className="yypay:h-11 yypay:w-44" />
        ) : price ? (
          <>
            <p className="yypay:flex yypay:items-baseline yypay:gap-1.5">
              <span className="yypay:text-4xl yypay:font-extrabold yypay:tracking-tight yypay:text-foreground yypay:tabular-nums">
                {price.amount}
              </span>
              <span className="yypay:text-sm yypay:font-medium yypay:text-muted-foreground">
                {price.period}
              </span>
            </p>
            {yearlyNote && (
              <p className="yypay:mt-1 yypay:text-xs yypay:text-muted-foreground">{yearlyNote}</p>
            )}
            {savingsNote && (
              <p className="yypay:mt-1.5 yypay:inline-flex yypay:rounded-full yypay:bg-emerald-500/10 yypay:px-2.5 yypay:py-0.5 yypay:text-xs yypay:font-semibold yypay:text-emerald-700 yypay:dark:text-emerald-300">
                {savingsNote}
              </p>
            )}
          </>
        ) : (
          <p className="yypay:text-sm yypay:text-muted-foreground">
            {t.plans.card.quoteOnRequest(formatBillingPeriodLabel(billingPeriod, t).toLowerCase())}
          </p>
        )}
      </div>

      <Button
        type="button"
        className="yypay:mt-5 yypay:h-11 yypay:w-full yypay:text-sm yypay:font-semibold"
        variant={highlighted && !isActivePlan ? "default" : "outline"}
        disabled={ctaDisabled}
        onClick={onSelect}
      >
        {ctaText}
      </Button>
      <p className="yypay:mt-2 yypay:text-center yypay:text-xs yypay:text-muted-foreground">
        {t.plans.card.priceNote}
      </p>

      {blockMessage && purchaseBlocked && !isActivePlan && (
        <p className="yypay:mt-2 yypay:text-xs yypay:text-muted-foreground">{blockMessage}</p>
      )}

      {isPendingPayment && (
        <p className="yypay:mt-2 yypay:text-xs yypay:text-muted-foreground">
          {t.plans.card.finalizePayment}
        </p>
      )}

      {isActivePlan && onEnableAutoRenewal && onDisableAutoRenewal && planCode && (
        <PlanAutoRenewalToggle
          className="yypay:mt-4"
          planCode={planCode}
          billingPeriod={billingPeriod}
          autoRenewal={autoRenewal}
          loading={autoRenewalLoading}
          mutating={autoRenewalMutating}
          onEnable={onEnableAutoRenewal}
          onDisable={onDisableAutoRenewal}
        />
      )}

      <div className="yypay:mt-6 yypay:flex-1 yypay:border-t yypay:border-border yypay:pt-6">
        <ul className="yypay:space-y-2.5">
          {visibleFeatures.map((feature) => (
            <li
              key={feature}
              className="yypay:flex yypay:items-start yypay:gap-2.5 yypay:text-sm yypay:text-foreground"
            >
              <span className="yypay:mt-0.5 yypay:flex yypay:h-4 yypay:w-4 yypay:shrink-0 yypay:items-center yypay:justify-center yypay:rounded-full yypay:bg-primary/10 yypay:text-primary">
                <Check className="yypay:h-3 yypay:w-3" strokeWidth={3} aria-hidden />
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {hiddenCount > 0 && (
          <button
            type="button"
            className="yypay:mt-3 yypay:inline-flex yypay:items-center yypay:gap-1 yypay:text-sm yypay:font-medium yypay:text-primary yypay:hover:underline"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
          >
            {expanded ? t.plans.card.collapse : t.plans.card.seeAllFeatures}
            {expanded ? (
              <ChevronUp className="yypay:h-4 yypay:w-4" aria-hidden />
            ) : (
              <ChevronDown className="yypay:h-4 yypay:w-4" aria-hidden />
            )}
          </button>
        )}

        {addOns.length > 0 && (
          <div className="yypay:mt-5">
            <p className="yypay:text-xs yypay:font-semibold yypay:uppercase yypay:tracking-wide yypay:text-muted-foreground">
              {t.plans.card.availableOptions}
            </p>
            <ul className="yypay:mt-2 yypay:flex yypay:flex-wrap yypay:gap-1.5">
              {addOns.map((code) => (
                <li
                  key={code}
                  className="yypay:inline-flex yypay:items-center yypay:gap-1 yypay:rounded-full yypay:border yypay:border-border yypay:px-2.5 yypay:py-1 yypay:text-xs yypay:text-secondary"
                >
                  <Plus className="yypay:h-3 yypay:w-3" aria-hidden />
                  {formatAddOnLabel(code, t)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
