"use client";

import { useLocale } from "@/i18n/locale-provider";
import {
  formatBillingPeriodLabel,
  type BillingPeriod,
} from "@/lib/commercial-plan-display";
import { cn } from "@/lib/utils";

type BillingPeriodToggleProps = {
  value: BillingPeriod;
  onChange: (period: BillingPeriod) => void;
  /** Meilleure économie de l'annuel (en %), affichée en pastille. */
  savingsPercent?: number;
  className?: string;
};

export function BillingPeriodToggle({
  value,
  onChange,
  savingsPercent = 0,
  className,
}: BillingPeriodToggleProps) {
  const { t } = useLocale();
  return (
    <div
      className={cn(
        "yypay:inline-flex yypay:rounded-full yypay:border yypay:border-border yypay:bg-card yypay:p-1 yypay:shadow-sm",
        className,
      )}
      role="group"
      aria-label={t.plans.billingToggleAriaLabel}
    >
      {(["MONTHLY", "YEARLY"] as const).map((period) => {
        const selected = value === period;
        const showSavings = period === "YEARLY" && savingsPercent > 0;
        return (
          <button
            key={period}
            type="button"
            onClick={() => onChange(period)}
            className={cn(
              "yypay:inline-flex yypay:items-center yypay:justify-center yypay:gap-2 yypay:rounded-full yypay:px-5 yypay:py-2 yypay:text-sm yypay:font-semibold yypay:transition-all",
              "yypay:min-w-[6.5rem]",
              selected
                ? "yypay:bg-primary yypay:text-primary-foreground yypay:shadow-sm"
                : "yypay:text-secondary yypay:hover:bg-muted yypay:hover:text-foreground",
            )}
            aria-pressed={selected}
          >
            {formatBillingPeriodLabel(period, t)}
            {showSavings && (
              <span
                className={cn(
                  "yypay:rounded-full yypay:px-2 yypay:py-0.5 yypay:text-xs yypay:font-bold",
                  selected
                    ? "yypay:bg-white/20 yypay:text-white"
                    : "yypay:bg-emerald-500/15 yypay:text-emerald-700 yypay:dark:text-emerald-300",
                )}
              >
                {t.plans.yearlySavingsBadge(savingsPercent)}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
