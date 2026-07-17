"use client";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { bffGet } from "@/lib/bff-client";
import type { components } from "@/types/schemas-payment";
import {
  Building2,
  ChevronRight,
  CreditCard,
  Lock,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type PlanResponse = components["schemas"]["PlanResponse"];

const AUTH_FLOW_STEPS = [
  "login",
  "MFA",
  "discover-contexts",
  "select-context",
];

const STEPS = [
  {
    icon: Lock,
    title: "Connexion sécurisée",
    description: "Authentification MFA par email via le Kernel IWM.",
  },
  {
    icon: Building2,
    title: "Choisir votre organisation",
    description: "Sélectionnez le contexte organisationnel à gérer.",
  },
  {
    icon: CreditCard,
    title: "Wallet & services",
    description: "Consultez votre solde, transactions et plans disponibles.",
  },
  {
    icon: ShoppingCart,
    title: "Payer simplement",
    description: "Panier en mémoire, paiement wallet ou MYCOOLPAY.",
  },
];

export default function LandingPage() {
  const [plans, setPlans] = useState<PlanResponse[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    bffGet<PlanResponse[]>("/api/plans")
      .then((data) => setPlans(Array.isArray(data) ? data : []))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, []);

  return (
    <div className="yypay:flex yypay:min-h-full yypay:flex-col">
      <SiteHeader />
      <main className="yypay:flex-1">
        <section
          id="accueil"
          className="yypay:mx-auto yypay:max-w-6xl yypay:px-4 yypay:py-16 sm:yypay:px-6 sm:yypay:py-24"
        >
          <div className="yypay:mx-auto yypay:max-w-3xl yypay:text-center">
            <Badge className="yypay:mb-4">Plateforme de paiement IWM</Badge>
            <h1 className="yypay:text-3xl yypay:font-bold yypay:tracking-tight yypay:text-navy sm:yypay:text-5xl">
              Gérez vos paiements et abonnements en toute simplicité
            </h1>
            <p className="yypay:mt-4 yypay:text-base yypay:text-secondary sm:yypay:text-lg">
              YowYob Payment centralise wallet, transactions et souscription aux
              services via un parcours sécurisé délégué au Kernel - aucun mot de
              passe n&apos;est stocké côté front.
            </p>
            <div className="yypay:mt-8 yypay:flex yypay:flex-col yypay:items-center yypay:justify-center yypay:gap-3 sm:yypay:flex-row">
              <Button asChild size="lg">
                <Link href="/login">Se connecter</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="#comment-ca-marche">Voir comment ça marche</a>
              </Button>
            </div>
          </div>
        </section>

        <section
          id="comment-ca-marche"
          className="yypay:border-y yypay:border-border yypay:bg-white yypay:py-16 sm:yypay:py-20"
        >
          <div className="yypay:mx-auto yypay:max-w-6xl yypay:px-4 sm:yypay:px-6">
            <div className="yypay:mb-10 yypay:text-center">
              <h2 className="yypay:text-2xl yypay:font-bold yypay:text-navy sm:yypay:text-3xl">
                Comment ça marche
              </h2>
              <p className="yypay:mt-2 yypay:text-secondary">
                Un parcours en 4 étapes, de la connexion au paiement.
              </p>
            </div>
            <div className="yypay:grid yypay:grid-cols-1 yypay:gap-6 sm:yypay:grid-cols-2 lg:yypay:grid-cols-4">
              {STEPS.map((step) => (
                <Card key={step.title}>
                  <CardHeader>
                    <step.icon className="yypay:mb-2 yypay:h-8 yypay:w-8 yypay:text-primary" />
                    <CardTitle className="yypay:text-lg">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section
          id="documentation"
          className="yypay:mx-auto yypay:max-w-6xl yypay:px-4 yypay:py-16 sm:yypay:px-6"
        >
          <Card>
            <CardHeader>
              <div className="yypay:flex yypay:items-center yypay:gap-2">
                <ShieldCheck className="yypay:h-5 yypay:w-5 yypay:text-primary" />
                <CardTitle>Documentation technique</CardTitle>
              </div>
              <CardDescription>
                Le front consomme exclusivement le BFF Next.js. Les types proviennent
                des OpenAPI auth et payment.
              </CardDescription>
            </CardHeader>
            <CardContent className="yypay:grid yypay:gap-4 sm:yypay:grid-cols-2">
              <div className="yypay:rounded-lg yypay:border yypay:border-border yypay:p-4">
                <p className="yypay:font-medium yypay:text-navy">Auth</p>
                <div className="yypay:mt-2 yypay:flex yypay:flex-wrap yypay:items-center yypay:gap-1.5 yypay:text-sm yypay:text-secondary">
                  {AUTH_FLOW_STEPS.map((step, index) => (
                    <span
                      key={step}
                      className="yypay:inline-flex yypay:items-center yypay:gap-1.5"
                    >
                      {index > 0 && (
                        <ChevronRight
                          className="yypay:h-3.5 yypay:w-3.5 yypay:shrink-0 yypay:text-secondary/60"
                          aria-hidden
                        />
                      )}
                      <span>{step}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="yypay:rounded-lg yypay:border yypay:border-border yypay:p-4">
                <p className="yypay:font-medium yypay:text-navy">Payment</p>
                <p className="yypay:mt-1 yypay:text-sm yypay:text-secondary">
                  wallet, transactions, plans, service-bundles, MYCOOLPAY
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section
          id="tarifs"
          className="yypay:border-t yypay:border-border yypay:bg-white yypay:py-16 sm:yypay:py-20"
        >
          <div className="yypay:mx-auto yypay:max-w-6xl yypay:px-4 sm:yypay:px-6">
            <div className="yypay:mb-10 yypay:text-center">
              <h2 className="yypay:text-2xl yypay:font-bold yypay:text-navy sm:yypay:text-3xl">
                Tarifs
              </h2>
              <p className="yypay:mt-2 yypay:text-secondary">
                Plans disponibles sur la plateforme.
              </p>
            </div>
            <div className="yypay:grid yypay:grid-cols-1 yypay:gap-6 md:yypay:grid-cols-2 lg:yypay:grid-cols-3">
              {loadingPlans &&
                Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="yypay:h-48 yypay:w-full" />
                ))}
              {!loadingPlans &&
                plans.map((plan) => (
                  <Card key={plan.code}>
                    <CardHeader>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="yypay:text-2xl yypay:font-bold yypay:text-primary">
                        {plan.price} {plan.currency}
                      </p>
                      <p className="yypay:mt-1 yypay:text-sm yypay:text-secondary">
                        {plan.periodDays} jours
                      </p>
                    </CardContent>
                  </Card>
                ))}
              {!loadingPlans && plans.length === 0 && (
                <p className="yypay:col-span-full yypay:text-center yypay:text-secondary">
                  Aucun plan disponible pour le moment.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
