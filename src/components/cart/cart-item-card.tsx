"use client";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/locale-provider";
import { getPlanLabel } from "@/lib/commercial-plan-display";
import { useCartStore, type CartPlanItem } from "@/stores/cart-store";
import { Trash2 } from "lucide-react";

/** Un plan du panier, avec ses add-ons activables. */
export function CartItemCard({ item }: { item: CartPlanItem }) {
  const { t } = useLocale();
  const removePlan = useCartStore((state) => state.removePlan);
  const togglePlanAddOn = useCartStore((state) => state.togglePlanAddOn);
  const planCode = item.plan.code ?? "";
  const compatibleAddOns = item.plan.compatibleAddOnCodes ?? [];

  return (
    <li className="yypay:rounded-lg yypay:border yypay:border-border yypay:p-4">
      <div className="yypay:flex yypay:items-start yypay:justify-between yypay:gap-3">
        <div className="yypay:min-w-0">
          <p className="yypay:font-medium yypay:text-foreground">
            {getPlanLabel(item.plan, t)}
          </p>
          <p className="yypay:text-sm yypay:text-secondary">{planCode}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => planCode && removePlan(planCode)}
          aria-label={t.cart.removeFromCart}
        >
          <Trash2 className="yypay:h-4 yypay:w-4" />
        </Button>
      </div>

      {compatibleAddOns.length > 0 && (
        <div className="yypay:mt-4 yypay:space-y-2">
          <p className="yypay:text-xs yypay:font-medium yypay:uppercase yypay:tracking-wide yypay:text-secondary">
            {t.cart.addOns}
          </p>
          <div className="yypay:flex yypay:flex-wrap yypay:gap-2">
            {compatibleAddOns.map((addOnCode) => {
              const selected = item.addOnCodes.includes(addOnCode);
              return (
                <Button
                  key={addOnCode}
                  type="button"
                  size="sm"
                  variant={selected ? "default" : "outline"}
                  aria-pressed={selected}
                  onClick={() => planCode && togglePlanAddOn(planCode, addOnCode)}
                >
                  {addOnCode}
                </Button>
              );
            })}
          </div>
        </div>
      )}
    </li>
  );
}
