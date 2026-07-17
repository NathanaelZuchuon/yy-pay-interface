"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { bffGet, bffPost } from "@/lib/bff-client";
import { COMMERCIAL_PLAN_ORDER_STORAGE_KEY } from "@/lib/bundle-constants";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import type { components } from "@/types/schemas-payment";
import { CreditCard, Loader2, Trash2, Wallet } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";

type CommercialPlanCheckoutResponse =
  components["schemas"]["CommercialPlanCheckoutResponse"];
type CommercialPlanQuoteResponse =
  components["schemas"]["CommercialPlanQuoteResponse"];
type CommercialPlanQuoteLine =
  components["schemas"]["CommercialPlanQuoteLine"];
type BillingPeriod = NonNullable<
  components["schemas"]["CommercialPlanCheckoutRequest"]["billingPeriod"]
>;

type AggregatedQuote = {
  billingPeriod: BillingPeriod;
  lines: CommercialPlanQuoteLine[];
  total: number;
  currency: string;
};

type SessionContext = {
  organizationId: string | null;
  actorId: string | null;
  walletId: string | null;
};

function createCartIdempotencyKey(planCode: string) {
  return `cart-${planCode}-${crypto.randomUUID()}`;
}

function redirectToPayment(url: string) {
  globalThis.location.assign(url);
}

type CartSheetProps = {
  trigger: ReactNode;
  onCheckoutComplete?: () => void;
};

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return isMobile;
}

export function CartSheet({ trigger, onCheckoutComplete }: CartSheetProps) {
  const [open, setOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("MONTHLY");
  const [quote, setQuote] = useState<AggregatedQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState<"wallet" | "mycoolpay" | null>(
    null,
  );
  const isMobile = useIsMobile();
  const items = useCartStore((state) => state.items);
  const removePlan = useCartStore((state) => state.removePlan);
  const clearCart = useCartStore((state) => state.clearCart);

  const planCodes = useMemo(
    () =>
      [...new Set(items.map((plan) => plan.code).filter(Boolean) as string[])],
    [items],
  );
  const quoteTotal = quote?.total ?? 0;
  const quoteCurrency = quote?.currency ?? items[0]?.currency ?? "XAF";

  useEffect(() => {
    if (!open || planCodes.length === 0) {
      return;
    }

    let cancelled = false;
    const timer = globalThis.setTimeout(() => {
      setQuoteLoading(true);
      void Promise.all(
        planCodes.map((planCode) =>
          bffPost<CommercialPlanQuoteResponse>(
            `/api/commercial-plans/${planCode}/quote`,
            { billingPeriod, addOnCodes: [] },
          ),
        ),
      )
        .then((quotes) => {
          if (cancelled) return;

          const lines = quotes.flatMap((planQuote) =>
            (planQuote.lines ?? []).map((line) => ({
              ...line,
              serviceCode: planQuote.plan?.code
                ? `${planQuote.plan.code}:${line.serviceCode ?? ""}`
                : line.serviceCode,
            })),
          );
          const total = quotes.reduce(
            (sum, planQuote) => sum + (planQuote.total ?? 0),
            0,
          );
          const currency =
            quotes.find((planQuote) => planQuote.currency)?.currency ?? "XAF";

          setQuote({ billingPeriod, lines, total, currency });
        })
        .catch((error) => {
          if (!cancelled) {
            setQuote(null);
            toast.error(
              error instanceof Error
                ? error.message
                : "Impossible de calculer le devis",
            );
          }
        })
        .finally(() => {
          if (!cancelled) {
            setQuoteLoading(false);
          }
        });
    }, 0);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timer);
    };
  }, [open, planCodes, billingPeriod]);

  useEffect(() => {
    if (!open || planCodes.length === 0) {
      const timer = globalThis.setTimeout(() => setQuote(null), 0);
      return () => globalThis.clearTimeout(timer);
    }
  }, [open, planCodes.length]);

  async function getSessionContext(): Promise<SessionContext> {
    return bffGet<SessionContext>("/api/session/context");
  }

  async function handleWalletCheckout() {
    if (items.length === 0) return;
    setCheckingOut("wallet");
    try {
      const context = await getSessionContext();
      if (!context.organizationId) {
        throw new Error("Organisation non sélectionnée");
      }
      if (!context.walletId) {
        throw new Error("Aucun wallet disponible. Créez-en un d'abord.");
      }
      if (!quoteTotal) {
        throw new Error("Devis indisponible. Réessayez dans un instant.");
      }

      const canOperate = await bffGet<boolean>(
        `/api/payments/wallets/${context.walletId}/can-operate?amount=${quoteTotal}`,
      );
      if (!canOperate) {
        toast.error("Solde insuffisant. Rechargez votre wallet.");
        return;
      }

      const failures: string[] = [];
      for (const plan of items) {
        if (!plan.code) continue;
        try {
          await bffPost(`/api/plans/${plan.code}/purchase`, {
            organizationId: context.organizationId,
          });
        } catch (error) {
          failures.push(
            plan.name ??
              plan.code ??
              (error instanceof Error ? error.message : "Erreur inconnue"),
          );
        }
      }

      if (failures.length > 0) {
        toast.error(
          `Échec partiel : ${failures.join(", ")}. Les autres plans ont été traités.`,
        );
      } else {
        toast.success("Paiement effectué via wallet");
      }

      clearCart();
      setOpen(false);
      onCheckoutComplete?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Paiement wallet impossible",
      );
    } finally {
      setCheckingOut(null);
    }
  }

  async function handleMycoolpayCheckout() {
    if (items.length === 0) return;
    if (items.length > 1) {
      toast.error("MYCOOLPAY accepte un seul plan commercial par paiement.");
      return;
    }

    const planCode = items[0]?.code;
    if (!planCode) {
      toast.error("Plan invalide dans le panier");
      return;
    }

    setCheckingOut("mycoolpay");
    try {
      const context = await getSessionContext();
      if (!context.organizationId) {
        throw new Error("Organisation non sélectionnée");
      }

      const checkout = await bffPost<CommercialPlanCheckoutResponse>(
        `/api/commercial-plans/${planCode}/checkout`,
        {
          organizationId: context.organizationId,
          addOnCodes: [],
          billingPeriod,
          provider: "MYCOOLPAY",
          method: "MOBILE_MONEY",
          idempotencyKey: createCartIdempotencyKey(planCode),
        },
      );

      if (checkout.orderId) {
        sessionStorage.setItem(
          COMMERCIAL_PLAN_ORDER_STORAGE_KEY,
          checkout.orderId,
        );
      }

      if (checkout.redirectUrl) {
        clearCart();
        redirectToPayment(checkout.redirectUrl);
        return;
      }

      toast.error("URL de redirection MYCOOLPAY indisponible");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Paiement MYCOOLPAY impossible",
      );
    } finally {
      setCheckingOut(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side={isMobile ? "bottom" : "right"}>
        <SheetHeader>
          <SheetTitle>Panier</SheetTitle>
          <SheetDescription>
            {items.length} article(s)
            {quoteLoading
              ? " — calcul du devis…"
              : quote
                ? ` — total ${quoteTotal.toLocaleString("fr-FR")} ${quoteCurrency}`
                : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="yypay:flex-1 yypay:overflow-y-auto yypay:px-6 yypay:py-4">
          {items.length === 0 ? (
            <p className="yypay:text-sm yypay:text-secondary">
              Votre panier est vide. Ajoutez des plans depuis la console.
            </p>
          ) : (
            <>
              <div className="yypay:mb-4 yypay:flex yypay:gap-2">
                {(["MONTHLY", "YEARLY"] as const).map((period) => (
                  <Button
                    key={period}
                    type="button"
                    size="sm"
                    variant={billingPeriod === period ? "default" : "outline"}
                    className="yypay:flex-1"
                    onClick={() => setBillingPeriod(period)}
                  >
                    {period === "MONTHLY" ? "Mensuel" : "Annuel"}
                  </Button>
                ))}
              </div>
              <ul className="yypay:space-y-4">
                {items.map((plan) => (
                  <li
                    key={plan.code}
                    className="yypay:flex yypay:items-start yypay:justify-between yypay:gap-3"
                  >
                    <div className="yypay:min-w-0">
                      <p className="yypay:font-medium yypay:text-navy">
                        {plan.name}
                      </p>
                      <p className="yypay:text-sm yypay:text-secondary">
                        {plan.code}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => plan.code && removePlan(plan.code)}
                      aria-label="Retirer du panier"
                    >
                      <Trash2 className="yypay:h-4 yypay:w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
              {quote?.lines && quote.lines.length > 0 && (
                <div
                  className={cn(
                    "yypay:mt-4 yypay:rounded-lg yypay:border yypay:border-border yypay:p-3",
                    "yypay:text-sm yypay:text-secondary",
                  )}
                >
                  <p className="yypay:mb-2 yypay:font-medium yypay:text-navy">
                    Détail du devis
                  </p>
                  <ul className="yypay:space-y-1">
                    {quote.lines.map((line, index) => (
                      <li
                        key={`${line.serviceCode}-${index}`}
                        className="yypay:flex yypay:justify-between yypay:gap-2"
                      >
                        <span>{line.serviceCode}</span>
                        <span>
                          {line.amount?.toLocaleString("fr-FR")} {line.currency}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {items.length > 0 && (
          <>
            <Separator />
            <SheetFooter>
              <div className="yypay:flex yypay:w-full yypay:flex-col yypay:gap-2">
                <Button
                  onClick={handleWalletCheckout}
                  disabled={checkingOut !== null || quoteLoading || !quote}
                  className="yypay:w-full"
                >
                  {checkingOut === "wallet" ? (
                    <Loader2 className="yypay:h-4 yypay:w-4 yypay:animate-spin" />
                  ) : (
                    <Wallet className="yypay:h-4 yypay:w-4" />
                  )}
                  Payer via wallet
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMycoolpayCheckout}
                  disabled={
                    checkingOut !== null ||
                    quoteLoading ||
                    !quote ||
                    items.length > 1
                  }
                  className="yypay:w-full"
                >
                  {checkingOut === "mycoolpay" ? (
                    <Loader2 className="yypay:h-4 yypay:w-4 yypay:animate-spin" />
                  ) : (
                    <CreditCard className="yypay:h-4 yypay:w-4" />
                  )}
                  Payer via MYCOOLPAY
                </Button>
                {items.length > 1 && (
                  <p className="yypay:text-center yypay:text-xs yypay:text-secondary">
                    MYCOOLPAY : un seul plan à la fois. Utilisez le wallet pour
                    plusieurs plans.
                  </p>
                )}
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
