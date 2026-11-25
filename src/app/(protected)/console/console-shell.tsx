"use client";

import {
  ConsoleDataProvider,
  useConsoleData,
} from "@/components/console/console-data-provider";
import { AppFooter } from "@/components/layout/app-footer";
import { ConsoleHeader } from "@/components/layout/console-header";
import { ConsoleSidebar } from "@/components/layout/console-sidebar";
import {
  OnboardingProvider,
  useOnboarding,
} from "@/components/onboarding/onboarding-tour";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsDesktop, useSidebarCollapsed } from "@/hooks/use-sidebar-layout";
import { useLocale } from "@/i18n/locale-provider";
import { bffPost } from "@/lib/bff-client";
import {
  BUNDLE_ORDER_STORAGE_KEY,
  COMMERCIAL_PLAN_ORDER_STORAGE_KEY,
  RECHARGE_ORDER_STORAGE_KEY,
} from "@/lib/bundle-constants";
import { parsePaymentReturn } from "@/lib/payment-callback";
import { cn } from "@/lib/utils";
import type { components } from "@/types/schemas-payment";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";

type CommercialPlanOrderResponse =
  components["schemas"]["CommercialPlanOrderResponse"];
type ServiceBundleOrderResponse =
  components["schemas"]["ServiceBundleOrderResponse"];
type WalletRechargeResponse =
  components["schemas"]["WalletRechargeResponse"];

function isFailureStatus(status?: string): boolean {
  const normalized = status?.trim().toUpperCase();
  return (
    normalized === "FAILED" ||
    normalized === "CANCELLED" ||
    normalized === "CANCELED"
  );
}

function PaymentReturnHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentReturn = parsePaymentReturn(searchParams.get("payment"));
  const { bumpRefresh } = useConsoleData();
  const { t } = useLocale();
  const pr = t.paymentReturn;

  useEffect(() => {
    const commercialPlanOrderId = sessionStorage.getItem(
      COMMERCIAL_PLAN_ORDER_STORAGE_KEY,
    );
    const bundleOrderId = sessionStorage.getItem(BUNDLE_ORDER_STORAGE_KEY);
    const rechargeOrderId = sessionStorage.getItem(RECHARGE_ORDER_STORAGE_KEY);
    const planOrderId = commercialPlanOrderId ?? bundleOrderId;

    if (
      !paymentReturn &&
      !commercialPlanOrderId &&
      !bundleOrderId &&
      !rechargeOrderId
    ) {
      return;
    }

    let cancelled = false;

    function clearPaymentQueryParam() {
      if (paymentReturn) {
        router.replace("/console", { scroll: false });
      }
    }

    function notifyPaymentReturnWithoutOrder() {
      if (!paymentReturn || planOrderId || rechargeOrderId) {
        return;
      }

      if (paymentReturn === "success") {
        toast.success(pr.genericSuccess);
      } else if (paymentReturn === "cancelled") {
        toast.error(pr.genericCancelled);
      } else {
        toast.error(pr.genericFailed);
      }

      bumpRefresh();
    }

    async function refreshPendingOrders() {
      if (rechargeOrderId) {
        try {
          const order = await bffPost<WalletRechargeResponse>(
            `/api/payments/wallets/recharge-orders/${rechargeOrderId}/refresh`,
          );

          if (cancelled) return;

          sessionStorage.removeItem(RECHARGE_ORDER_STORAGE_KEY);

          if (order.status === "RECHARGED") {
            toast.success(pr.rechargeConfirmed);
          } else if (isFailureStatus(order.status)) {
            toast.error(
              paymentReturn === "cancelled"
                ? pr.rechargeCancelled
                : pr.rechargeFailedOrCancelled,
            );
          } else if (paymentReturn === "failure" || paymentReturn === "cancelled") {
            toast.error(
              paymentReturn === "cancelled"
                ? pr.rechargeCancelled
                : pr.rechargeFailed,
            );
          } else {
            toast.success(pr.rechargeProcessing);
          }

          bumpRefresh();
        } catch (error) {
          if (!cancelled) {
            toast.error(
              error instanceof Error ? error.message : pr.rechargeConfirmError,
            );
          }
        }
      }

      if (!planOrderId) {
        notifyPaymentReturnWithoutOrder();
        if (!cancelled) {
          clearPaymentQueryParam();
        }
        return;
      }

      try {
        if (commercialPlanOrderId) {
          const order = await bffPost<CommercialPlanOrderResponse>(
            `/api/commercial-plans/orders/${commercialPlanOrderId}/refresh`,
          );

          if (cancelled) return;

          sessionStorage.removeItem(COMMERCIAL_PLAN_ORDER_STORAGE_KEY);

          if (order.status === "ACTIVE") {
            toast.success(pr.planActivated);
          } else if (isFailureStatus(order.status)) {
            toast.error(
              paymentReturn === "cancelled"
                ? pr.planCancelled
                : pr.planFailedOrCancelled,
            );
          } else if (paymentReturn === "failure" || paymentReturn === "cancelled") {
            toast.error(
              paymentReturn === "cancelled" ? pr.planCancelled : pr.planFailed,
            );
          } else {
            toast.success(pr.processing);
          }
        } else {
          const order = await bffPost<ServiceBundleOrderResponse>(
            `/api/service-bundles/orders/${planOrderId}/refresh`,
          );

          if (cancelled) return;

          sessionStorage.removeItem(BUNDLE_ORDER_STORAGE_KEY);

          if (order.status === "ACTIVE") {
            toast.success(pr.bundleActivated);
          } else if (isFailureStatus(order.status)) {
            toast.error(
              paymentReturn === "cancelled"
                ? pr.bundleCancelled
                : pr.bundleFailedOrCancelled,
            );
          } else if (paymentReturn === "failure" || paymentReturn === "cancelled") {
            toast.error(
              paymentReturn === "cancelled" ? pr.bundleCancelled : pr.bundleFailed,
            );
          } else {
            toast.success(pr.processing);
          }
        }

        bumpRefresh();
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : pr.confirmError);
        }
      } finally {
        if (!cancelled) {
          clearPaymentQueryParam();
        }
      }
    }

    void refreshPendingOrders();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentReturn, bumpRefresh, router]);

  return null;
}

const SIDEBAR_ID = "console-sidebar";
const PEEK_DELAY_MS = 150;

function ConsoleChrome({ children }: { children: ReactNode }) {
  const { wallet, bumpRefresh } = useConsoleData();
  const { restart } = useOnboarding();
  const { t } = useLocale();
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const isDesktop = useIsDesktop();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [peek, setPeek] = useState(false);
  const peekTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Mini-sidebar affichée seulement si réduite ET non survolée.
  const mini = collapsed && !peek;

  function cancelPeekTimer() {
    if (peekTimer.current) {
      clearTimeout(peekTimer.current);
      peekTimer.current = undefined;
    }
  }

  function handleMenuClick() {
    if (isDesktop) {
      cancelPeekTimer();
      setPeek(false);
      setCollapsed(!collapsed);
    } else {
      setDrawerOpen(true);
    }
  }

  // Hover-to-expand : la sidebar réduite se déploie en overlay, sans décaler le contenu.
  function handleMouseEnter() {
    if (!collapsed) return;
    cancelPeekTimer();
    peekTimer.current = setTimeout(() => setPeek(true), PEEK_DELAY_MS);
  }

  function handleMouseLeave() {
    cancelPeekTimer();
    setPeek(false);
  }

  // Même comportement pour la navigation clavier (focus visible uniquement).
  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    if (collapsed && event.target.matches(":focus-visible")) {
      setPeek(true);
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setPeek(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && peek) {
      setPeek(false);
    }
  }

  const menuLabel = isDesktop
    ? collapsed
      ? t.sidebar.expand
      : t.sidebar.collapse
    : t.header.openNav;

  return (
    <div className="yypay:flex yypay:min-h-screen yypay:flex-col yypay:bg-shell">
      <PaymentReturnHandler />
      <ConsoleHeader
        walletName={wallet?.ownerName}
        onCheckoutComplete={bumpRefresh}
        onOpenHelp={restart}
        onMenuClick={handleMenuClick}
        menuLabel={menuLabel}
        menuExpanded={isDesktop ? !collapsed : drawerOpen}
        menuControls={SIDEBAR_ID}
      />

      {/* Mobile / tablette : tiroir latéral avec backdrop. */}
      <Sheet open={drawerOpen && !isDesktop} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="left"
          aria-describedby={undefined}
          className="yypay:w-72 yypay:max-w-[85vw] yypay:border-none yypay:bg-shell yypay:pt-3"
        >
          <SheetTitle className="yypay:sr-only">{t.header.navigationTitle}</SheetTitle>
          <div className="yypay:flex-1 yypay:overflow-y-auto yypay:pb-6 yypay:pt-10">
            <ConsoleSidebar onNavigate={() => setDrawerOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="yypay:flex yypay:flex-1">
        {/* Desktop : la largeur réservée ne change qu'au clic sur ☰, jamais au survol. */}
        <aside
          id={SIDEBAR_ID}
          className={cn(
            "yypay:relative yypay:z-30 yypay:hidden yypay:shrink-0 yypay:transition-[width] yypay:duration-200 yypay:ease-out yypay:lg:block",
            collapsed ? "yypay:w-[72px]" : "yypay:w-64",
          )}
        >
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className={cn(
              "yypay:sticky yypay:top-16 yypay:h-[calc(100vh-4rem)] yypay:overflow-y-auto yypay:overflow-x-hidden yypay:bg-shell yypay:pb-4 yypay:transition-[width,box-shadow] yypay:duration-200 yypay:ease-out",
              collapsed && !peek && "yypay:w-[72px]",
              collapsed && peek && "yypay:w-64 yypay:rounded-r-2xl yypay:shadow-overlay",
              !collapsed && "yypay:w-64",
            )}
          >
            <ConsoleSidebar collapsed={mini} />
          </div>
        </aside>

        <main className="yypay:min-w-0 yypay:flex-1 yypay:px-2 yypay:pb-2 yypay:sm:px-4 yypay:sm:pb-4 yypay:lg:pl-0">
          <div className="yypay:min-h-[calc(100vh-8rem)] yypay:rounded-2xl yypay:bg-shell-panel yypay:px-4 yypay:py-6 yypay:sm:px-8 yypay:sm:py-8">
            <div className="yypay:mx-auto yypay:max-w-6xl">{children}</div>
          </div>
          <AppFooter className="yypay:px-4" />
        </main>
      </div>
    </div>
  );
}

export function ConsoleShell({ children }: { children: ReactNode }) {
  return (
    <ConsoleDataProvider>
      <OnboardingProvider>
        <ConsoleChrome>{children}</ConsoleChrome>
      </OnboardingProvider>
    </ConsoleDataProvider>
  );
}
