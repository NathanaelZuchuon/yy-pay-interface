import type { components } from "@/types/schemas-payment";

export type CommercialPlanCheckoutResponse =
  components["schemas"]["CommercialPlanCheckoutResponse"];
export type CommercialPlanQuoteResponse =
  components["schemas"]["CommercialPlanQuoteResponse"];
export type CommercialPlanResponse = components["schemas"]["CommercialPlanResponse"];
export type CommercialPlanOrderResponse =
  components["schemas"]["CommercialPlanOrderResponse"];
export type SubscriptionResponse = components["schemas"]["SubscriptionResponse"];
export type ServicePriceLine = components["schemas"]["ServicePriceResponse"];
export type BillingPeriod = NonNullable<
  components["schemas"]["CommercialPlanCheckoutRequest"]["billingPeriod"]
>;

/** Devis consolidé de tous les plans du panier. */
export type AggregatedQuote = {
  billingPeriod: BillingPeriod;
  lines: ServicePriceLine[];
  total: number;
  currency: string;
};

export type SessionContext = {
  organizationId: string | null;
  actorId: string | null;
  walletId: string | null;
};
