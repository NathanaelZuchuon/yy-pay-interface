"use client";

import { CartItemCard } from "@/components/cart/cart-item-card";
import { CartQuoteDetails } from "@/components/cart/cart-quote-details";
import type {
  BillingPeriod,
  CommercialPlanCheckoutResponse,
  SessionContext,
} from "@/components/cart/cart-types";
import { useCartQuote } from "@/components/cart/use-cart-quote";
import { usePurchaseGuard } from "@/components/cart/use-purchase-guard";
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
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatMoney, toIntlTag } from "@/i18n/format";
import { useLocale } from "@/i18n/locale-provider";
import { bffGet, bffPost } from "@/lib/bff-client";
import { COMMERCIAL_PLAN_ORDER_STORAGE_KEY } from "@/lib/bundle-constants";
import {
  formatBillingPeriodLabel,
  getPlanLabel,
} from "@/lib/commercial-plan-display";
import { formatMycoolpayLabel } from "@/lib/wallet-labels";
import { useCartStore } from "@/stores/cart-store";
import { CreditCard, Loader2, Wallet } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

function createCartIdempotencyKey(planCode: string) {
  return `cart-${planCode}-${crypto.randomUUID()}`;
}

function redirectToPayment(url: string) {
  globalThis.location.assign(url);
}

function getSessionContext(): Promise<SessionContext> {
  return bffGet<SessionContext>("/api/session/context");
}

type CartSheetProps = {
  trigger: ReactNode;
  walletName?: string | null;
  onCheckoutComplete?: () => void;
};

export function CartSheet({ trigger, walletName, onCheckoutComplete }: CartSheetProps) {
  const { t, locale } = useLocale();
  const intlTag = toIntlTag(locale);
  const [open, setOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("MONTHLY");
  const [checkingOut, setCheckingOut] = useState<"wallet" | "mycoolpay" | null>(
    null,
  );
  const isMobile = useMediaQuery("(max-width: 767px)");
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const { quote, quoteLoading, quoteSignature } = useCartQuote(
    open,
    items,
    billingPeriod,
  );
  const { purchaseBlockMessage, guardLoading } = usePurchaseGuard(
    open,
    items,
    quoteSignature,
  );

  const quoteTotal = quote?.total ?? 0;
  const quoteCurrency = quote?.currency ?? "XAF";
  const mycoolpayLabel = formatMycoolpayLabel(walletName);
  const checkoutBusy =
    checkingOut !== null ||
    quoteLoading ||
    guardLoading ||
    !quote ||
    Boolean(purchaseBlockMessage);

  function assertCheckoutAllowed(): boolean {
    if (purchaseBlockMessage) {
      toast.error(purchaseBlockMessage);
      return false;
    }
    return true;
  }

  async function handleWalletCheckout() {
    if (items.length === 0) return;
    if (!assertCheckoutAllowed()) return;
    setCheckingOut("wallet");
    try {
      const context = await getSessionContext();
      if (!context.organizationId) {
        throw new Error(t.cart.orgNotSelected);
      }
      if (!context.walletId) {
        throw new Error(t.cart.noWallet);
      }
      if (!quoteTotal) {
        throw new Error(t.cart.quoteUnavailable);
      }

      const canOperate = await bffGet<boolean>(
        `/api/payments/wallets/${context.walletId}/can-operate?amount=${quoteTotal}`,
      );
      if (!canOperate) {
        toast.error(t.cart.insufficientBalance);
        return;
      }

      const failures: string[] = [];
      for (const item of items) {
        if (!item.plan.code) continue;
        try {
          await bffPost(`/api/plans/${item.plan.code}/purchase`, {
            organizationId: context.organizationId,
          });
        } catch (error) {
          failures.push(
            getPlanLabel(item.plan, t) ??
              (error instanceof Error ? error.message : t.cart.unknownError),
          );
        }
      }

      if (failures.length > 0) {
        toast.error(t.cart.partialFailure(failures.join(", ")));
      } else {
        toast.success(t.cart.walletPaymentSuccess);
      }

      clearCart();
      setOpen(false);
      onCheckoutComplete?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.cart.walletPaymentError);
    } finally {
      setCheckingOut(null);
    }
  }

  async function handleMycoolpayCheckout() {
    if (items.length === 0) return;
    if (!assertCheckoutAllowed()) return;
    if (items.length > 1) {
      toast.error(t.cart.mycoolpaySingleLimit);
      return;
    }

    const cartItem = items[0];
    const planCode = cartItem?.plan.code;
    if (!planCode) {
      toast.error(t.cart.invalidPlanInCart);
      return;
    }

    setCheckingOut("mycoolpay");
    try {
      const context = await getSessionContext();
      if (!context.organizationId) {
        throw new Error(t.cart.orgNotSelected);
      }

      const checkout = await bffPost<CommercialPlanCheckoutResponse>(
        `/api/plans/${planCode}/checkout`,
        {
          organizationId: context.organizationId,
          addOnCodes: cartItem.addOnCodes,
          billingPeriod,
          provider: "MYCOOLPAY",
          method: "MOBILE_MONEY",
          idempotencyKey: createCartIdempotencyKey(planCode),
        },
      );

      if (checkout.orderId) {
        sessionStorage.setItem(COMMERCIAL_PLAN_ORDER_STORAGE_KEY, checkout.orderId);
      }

      if (checkout.redirectUrl) {
        clearCart();
        redirectToPayment(checkout.redirectUrl);
        return;
      }

      toast.error(t.cart.mycoolpayRedirectMissing);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t.cart.mycoolpayPaymentError,
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
          <SheetTitle>{t.cart.title}</SheetTitle>
          <SheetDescription>
            {t.cart.itemCount(items.length)}
            {quoteLoading
              ? t.cart.calculatingQuote
              : quote
                ? t.cart.totalSuffix(formatMoney(quoteTotal, quoteCurrency, intlTag))
                : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="yypay:flex-1 yypay:overflow-y-auto yypay:px-6 yypay:py-4">
          {items.length === 0 ? (
            <p className="yypay:text-sm yypay:text-secondary">{t.cart.empty}</p>
          ) : (
            <>
              {purchaseBlockMessage && (
                <div
                  role="alert"
                  className="yypay:mb-4 yypay:rounded-lg yypay:border yypay:border-border yypay:bg-muted/40 yypay:p-3 yypay:text-sm yypay:text-muted-foreground"
                >
                  {purchaseBlockMessage}
                </div>
              )}
              <div className="yypay:mb-4 yypay:flex yypay:gap-2">
                {(["MONTHLY", "YEARLY"] as const).map((period) => (
                  <Button
                    key={period}
                    type="button"
                    size="sm"
                    variant={billingPeriod === period ? "default" : "outline"}
                    aria-pressed={billingPeriod === period}
                    className="yypay:flex-1"
                    onClick={() => setBillingPeriod(period)}
                  >
                    {formatBillingPeriodLabel(period, t)}
                  </Button>
                ))}
              </div>
              <ul className="yypay:space-y-4">
                {items.map((item) => (
                  <CartItemCard
                    key={item.plan.code || getPlanLabel(item.plan, t)}
                    item={item}
                  />
                ))}
              </ul>
              <CartQuoteDetails quote={quote} />
            </>
          )}
        </div>

        {items.length > 0 && (
          <>
            <Separator />
            <SheetFooter>
              <div className="yypay:flex yypay:w-full yypay:flex-col yypay:gap-4">
                <Button
                  onClick={handleWalletCheckout}
                  disabled={checkoutBusy}
                  className="yypay:w-full"
                >
                  {checkingOut === "wallet" ? (
                    <Loader2 className="yypay:h-4 yypay:w-4 yypay:animate-spin" />
                  ) : (
                    <Wallet className="yypay:h-4 yypay:w-4" />
                  )}
                  {t.cart.payViaWallet}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleMycoolpayCheckout}
                  disabled={checkoutBusy || items.length > 1}
                  className="yypay:w-full"
                >
                  {checkingOut === "mycoolpay" ? (
                    <Loader2 className="yypay:h-4 yypay:w-4 yypay:animate-spin" />
                  ) : (
                    <CreditCard className="yypay:h-4 yypay:w-4" />
                  )}
                  {t.cart.payVia(mycoolpayLabel)}
                </Button>
                {items.length > 1 && (
                  <p className="yypay:pt-1 yypay:text-center yypay:text-xs yypay:text-secondary">
                    {t.cart.mycoolpaySingleWarning}
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
