"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { bffGet } from "@/lib/bff-client";
import { useCartStore } from "@/stores/cart-store";
import type { components } from "@/types/schemas-payment";
import { ShoppingCart } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type PlanResponse = components["schemas"]["PlanResponse"];
type SubscriptionResponse = components["schemas"]["SubscriptionResponse"];

export function PlansGrid() {
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const addPlan = useCartStore((state) => state.addPlan);
  const hasPlan = useCartStore((state) => state.hasPlan);

  useEffect(() => {
    async function load() {
      try {
        const [plansData, subsData] = await Promise.all([
          bffGet<PlanResponse[]>("/api/plans"),
          bffGet<SubscriptionResponse[]>("/api/plans/subscriptions"),
        ]);
        setPlans(Array.isArray(plansData) ? plansData : []);
        setSubscriptions(Array.isArray(subsData) ? subsData : []);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Impossible de charger les plans",
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const subscribedCodes = new Set(
    subscriptions.map((sub) => sub.planCode).filter(Boolean),
  );

  if (loading) {
    return (
      <div className="yypay:grid yypay:grid-cols-1 yypay:gap-4 md:yypay:grid-cols-2 lg:yypay:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="yypay:h-56" />
        ))}
      </div>
    );
  }

  return (
    <div className="yypay:grid yypay:grid-cols-1 yypay:gap-4 md:yypay:grid-cols-2 lg:yypay:grid-cols-3">
      {plans.map((plan) => {
        const isSubscribed = plan.code ? subscribedCodes.has(plan.code) : false;
        const inCart = plan.code ? hasPlan(plan.code) : false;
        return (
          <Card key={plan.code} className="yypay:flex yypay:flex-col">
            <CardHeader>
              <div className="yypay:flex yypay:items-start yypay:justify-between yypay:gap-2">
                <CardTitle className="yypay:text-lg">{plan.name}</CardTitle>
                {isSubscribed && <Badge variant="success">Actif</Badge>}
              </div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="yypay:space-y-3">
              <p className="yypay:text-2xl yypay:font-bold yypay:text-primary">
                {plan.price} {plan.currency}
              </p>
              <p className="yypay:text-sm yypay:text-secondary">
                {plan.periodDays} jours
              </p>
              <div className="yypay:flex yypay:flex-wrap yypay:gap-2">
                {(plan.serviceCodes ?? []).map((code) => (
                  <Badge key={code} variant="secondary">
                    {code}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="yypay:w-full"
                variant={inCart ? "secondary" : "default"}
                disabled={isSubscribed || inCart || !plan.code}
                onClick={() => {
                  addPlan(plan);
                  toast.success(`${plan.name} ajouté au panier`);
                }}
              >
                <ShoppingCart className="yypay:h-4 yypay:w-4" />
                {isSubscribed
                  ? "Déjà souscrit"
                  : inCart
                    ? "Dans le panier"
                    : "Ajouter au panier"}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
      {plans.length === 0 && (
        <p className="yypay:col-span-full yypay:text-secondary">
          Aucun plan disponible.
        </p>
      )}
    </div>
  );
}
