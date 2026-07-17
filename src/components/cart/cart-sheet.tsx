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
import { useCartStore } from "@/stores/cart-store";
import type { components } from "@/types/schemas-payment";
import { CreditCard, Loader2, Trash2, Wallet } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

type PaymentOrderResponse = components["schemas"]["PaymentOrderResponse"];

type SessionContext = {
  organizationId: string | null;
  actorId: string | null;
  walletId: string | null;
};

function createCartIdempotencyKey() {
  return `cart-${crypto.randomUUID()}`;
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
  const [checkingOut, setCheckingOut] = useState<"wallet" | "mycoolpay" | null>(
    null,
  );
  const isMobile = useIsMobile();
  const items = useCartStore((state) => state.items);
  const removePlan = useCartStore((state) => state.removePlan);
  const clearCart = useCartStore((state) => state.clearCart);
  const getTotalAmount = useCartStore((state) => state.totalAmount);
  const cartTotal = getTotalAmount();

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

      const canOperate = await bffGet<boolean>(
        `/api/payments/wallets/${context.walletId}/can-operate?amount=${cartTotal}`,
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
    setCheckingOut("mycoolpay");
    try {
      const firstPlan = items[0];
      const order = await bffPost<PaymentOrderResponse>("/api/payments/orders", {
        amount: cartTotal,
        provider: "MYCOOLPAY",
        method: "MOBILE_MONEY",
        serviceCode: firstPlan?.serviceCodes?.[0] ?? firstPlan?.code,
        description: `Achat de ${items.length} plan(s)`,
        idempotencyKey: createCartIdempotencyKey(),
      });

      if (order.redirectUrl) {
        clearCart();
        redirectToPayment(order.redirectUrl);
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
            {items.length} article(s) - total {cartTotal.toLocaleString("fr-FR")}
          </SheetDescription>
        </SheetHeader>

        <div className="yypay:flex-1 yypay:overflow-y-auto yypay:px-6 yypay:py-4">
          {items.length === 0 ? (
            <p className="yypay:text-sm yypay:text-secondary">
              Votre panier est vide. Ajoutez des plans depuis la console.
            </p>
          ) : (
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
                      {plan.price} {plan.currency}
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
          )}
        </div>

        {items.length > 0 && (
          <>
            <Separator />
            <SheetFooter>
              <div className="yypay:flex yypay:w-full yypay:flex-col yypay:gap-2">
                <Button
                  onClick={handleWalletCheckout}
                  disabled={checkingOut !== null}
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
                  disabled={checkingOut !== null}
                  className="yypay:w-full"
                >
                  {checkingOut === "mycoolpay" ? (
                    <Loader2 className="yypay:h-4 yypay:w-4 yypay:animate-spin" />
                  ) : (
                    <CreditCard className="yypay:h-4 yypay:w-4" />
                  )}
                  Payer via MYCOOLPAY
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
