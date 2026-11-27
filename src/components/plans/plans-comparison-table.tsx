"use client";

import { useLocale } from "@/i18n/locale-provider";
import {
  formatAddOnLabel,
  formatFeatureLabel,
  getPlanLabel,
} from "@/lib/commercial-plan-display";
import { cn } from "@/lib/utils";
import type { components } from "@/types/schemas-payment";
import { Check, Minus, Plus } from "lucide-react";

type CommercialPlanResponse = components["schemas"]["CommercialPlanResponse"];

type Row = { code: string; label: string };
type Group = {
  title: string;
  rows: Row[];
  has: (plan: CommercialPlanResponse, code: string) => boolean;
  kind: "included" | "option";
};

/** Codes de tous les plans, dédoublonnés par libellé, dans l'ordre d'apparition. */
function collectRows(
  plans: CommercialPlanResponse[],
  pick: (plan: CommercialPlanResponse) => string[] | undefined,
  label: (code: string) => string,
): Row[] {
  const rows: Row[] = [];
  const seenLabels = new Set<string>();
  for (const plan of plans) {
    for (const code of pick(plan) ?? []) {
      const text = label(code);
      if (!seenLabels.has(text)) {
        seenLabels.add(text);
        rows.push({ code, label: text });
      }
    }
  }
  return rows;
}

export function PlansComparisonTable({
  plans,
  highlightedPlanCode,
}: {
  plans: CommercialPlanResponse[];
  highlightedPlanCode?: string | null;
}) {
  const { t } = useLocale();
  const c = t.plans.comparison;
  const featureLabel = (code: string) => formatFeatureLabel(code, t);

  // Une ligne est « incluse » si le plan possède un code de même libellé (ex. HR et HRM).
  const hasLabel = (codes: string[] | undefined, code: string) => {
    const target = featureLabel(code);
    return (codes ?? []).some((candidate) => featureLabel(candidate) === target);
  };

  const allGroups: Group[] = [
    {
      title: c.packsGroup,
      rows: collectRows(plans, (plan) => plan.packCodes, featureLabel),
      has: (plan, code) => hasLabel(plan.packCodes, code),
      kind: "included",
    },
    {
      title: c.servicesGroup,
      rows: collectRows(plans, (plan) => plan.serviceCodes, featureLabel),
      has: (plan, code) => hasLabel(plan.serviceCodes, code),
      kind: "included",
    },
    {
      title: c.optionsGroup,
      rows: collectRows(
        plans,
        (plan) => plan.compatibleAddOnCodes,
        (code) => formatAddOnLabel(code, t),
      ),
      has: (plan, code) => (plan.compatibleAddOnCodes ?? []).includes(code),
      kind: "option",
    },
  ];
  const groups = allGroups.filter((group) => group.rows.length > 0);

  if (plans.length < 2 || groups.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="plans-comparison-title" className="yypay:mx-auto yypay:mt-16 yypay:max-w-7xl">
      <div className="yypay:text-center">
        <h2
          id="plans-comparison-title"
          className="yypay:text-2xl yypay:font-bold yypay:tracking-tight yypay:text-foreground"
        >
          {c.title}
        </h2>
        <p className="yypay:mt-2 yypay:text-muted-foreground">{c.description}</p>
      </div>

      <div className="yypay:mt-8 yypay:overflow-x-auto yypay:rounded-2xl yypay:border yypay:border-border yypay:bg-card yypay:shadow-card">
        <table className="yypay:w-full yypay:min-w-[36rem] yypay:border-collapse yypay:text-sm">
          <thead>
            <tr className="yypay:border-b yypay:border-border">
              <th
                scope="col"
                className="yypay:sticky yypay:left-0 yypay:z-10 yypay:min-w-52 yypay:bg-card yypay:px-5 yypay:py-4 yypay:text-left yypay:font-semibold yypay:text-muted-foreground"
              >
                {c.feature}
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.code}
                  scope="col"
                  className={cn(
                    "yypay:min-w-28 yypay:px-3 yypay:py-4 yypay:text-center yypay:align-bottom yypay:font-bold yypay:leading-snug yypay:text-foreground",
                    plan.code === highlightedPlanCode && "yypay:bg-primary/5 yypay:text-primary",
                  )}
                >
                  {getPlanLabel(plan, t)}
                </th>
              ))}
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.title}>
              <tr>
                <th
                  scope="colgroup"
                  colSpan={plans.length + 1}
                  className="yypay:bg-muted/50 yypay:px-5 yypay:py-2 yypay:text-left yypay:text-xs yypay:font-semibold yypay:uppercase yypay:tracking-wide yypay:text-muted-foreground"
                >
                  {group.title}
                </th>
              </tr>
              {group.rows.map((row) => (
                <tr key={row.code} className="yypay:border-t yypay:border-border/60">
                  <th
                    scope="row"
                    className="yypay:sticky yypay:left-0 yypay:z-10 yypay:whitespace-nowrap yypay:bg-card yypay:px-5 yypay:py-3 yypay:text-left yypay:font-medium yypay:text-foreground"
                  >
                    {row.label}
                  </th>
                  {plans.map((plan) => {
                    const included = group.has(plan, row.code);
                    return (
                      <td
                        key={plan.code}
                        className={cn(
                          "yypay:px-4 yypay:py-3 yypay:text-center",
                          plan.code === highlightedPlanCode && "yypay:bg-primary/5",
                        )}
                      >
                        {included ? (
                          group.kind === "option" ? (
                            <span className="yypay:inline-flex yypay:items-center yypay:gap-1 yypay:whitespace-nowrap yypay:text-xs yypay:font-medium yypay:text-secondary">
                              <Plus className="yypay:h-3.5 yypay:w-3.5" aria-hidden />
                              {c.optionAvailable}
                            </span>
                          ) : (
                            <span className="yypay:inline-flex yypay:h-6 yypay:w-6 yypay:items-center yypay:justify-center yypay:rounded-full yypay:bg-primary/10 yypay:text-primary">
                              <Check className="yypay:h-3.5 yypay:w-3.5" strokeWidth={3} aria-hidden />
                              <span className="yypay:sr-only">{c.included}</span>
                            </span>
                          )
                        ) : (
                          <span className="yypay:text-muted-foreground/60">
                            <Minus className="yypay:mx-auto yypay:h-4 yypay:w-4" aria-hidden />
                            <span className="yypay:sr-only">{c.notIncluded}</span>
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </section>
  );
}
