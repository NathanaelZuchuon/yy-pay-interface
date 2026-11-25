"use client";

import { useConsoleData } from "@/components/console/console-data-provider";
import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  EllipsisVertical,
  LayoutDashboard,
  Plus,
  Receipt,
  Server,
  Tag,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";

type NavAction = {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
};

type NavItem = {
  href: string;
  label: string;
  active: boolean;
  /** Icône lucide (filaire au repos, pleine quand actif). */
  icon?: LucideIcon;
  /** Pastille de couleur (catégories secondaires / « libellés »). */
  dotClassName?: string;
  /** Compteur discret aligné à droite. */
  count?: number;
  countLabel?: string;
  /** Actions rapides (menu ⋮) qui remplacent le compteur au survol. */
  actions?: NavAction[];
};

type ConsoleSidebarProps = {
  /** Mini-sidebar : icônes seules, centrées. */
  collapsed?: boolean;
  /** Appelé après une navigation (ferme le tiroir mobile). */
  onNavigate?: () => void;
  className?: string;
};

function NavItemActions({ item }: { item: NavItem }) {
  const { t } = useLocale();

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        aria-label={t.sidebar.moreActions(item.label)}
        className="yypay:absolute yypay:right-1 yypay:top-1/2 yypay:flex yypay:h-7 yypay:w-7 yypay:-translate-y-1/2 yypay:items-center yypay:justify-center yypay:rounded-full yypay:text-nav-foreground yypay:opacity-0 yypay:transition-opacity yypay:hover:bg-nav-hover yypay:focus-visible:opacity-100 yypay:group-hover/item:opacity-100 yypay:data-[state=open]:opacity-100"
      >
        <EllipsisVertical className="yypay:h-4 yypay:w-4" aria-hidden />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="right"
          align="start"
          sideOffset={4}
          className="yypay:z-[60] yypay:min-w-44 yypay:rounded-lg yypay:border yypay:border-border yypay:bg-card yypay:py-1 yypay:text-sm yypay:text-card-foreground yypay:shadow-overlay"
        >
          {item.actions?.map((action) => {
            const ActionIcon = action.icon;
            return (
              <DropdownMenu.Item
                key={action.label}
                onSelect={action.onSelect}
                className="yypay:flex yypay:cursor-pointer yypay:items-center yypay:gap-3 yypay:px-4 yypay:py-2 yypay:outline-none yypay:data-[highlighted]:bg-nav-hover"
              >
                <ActionIcon className="yypay:h-4 yypay:w-4" aria-hidden />
                {action.label}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function SidebarNavLink({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const hasCount = (item.count ?? 0) > 0;
  const hasActions = !collapsed && hasCount && !!item.actions?.length;

  return (
    <li className="yypay:group/item yypay:relative">
      <Link
        href={item.href}
        onClick={onNavigate}
        aria-current={item.active ? "page" : undefined}
        title={collapsed ? item.label : undefined}
        className={cn(
          "yypay:flex yypay:h-8 yypay:items-center yypay:gap-4 yypay:rounded-full yypay:text-sm yypay:text-nav-foreground yypay:transition-colors yypay:hover:bg-nav-hover",
          collapsed
            ? "yypay:mx-auto yypay:w-14 yypay:justify-center"
            : "yypay:pl-6 yypay:pr-3",
          item.active &&
            "yypay:bg-nav-active yypay:font-bold yypay:text-nav-active-foreground yypay:hover:bg-nav-active",
        )}
      >
        <span className="yypay:relative yypay:flex yypay:h-5 yypay:w-5 yypay:shrink-0 yypay:items-center yypay:justify-center">
          {Icon ? (
            <Icon
              aria-hidden
              className="yypay:h-5 yypay:w-5"
              fill={item.active ? "currentColor" : "none"}
              strokeWidth={item.active ? 2 : 1.75}
            />
          ) : (
            <span
              aria-hidden
              className={cn(
                "yypay:h-3 yypay:w-3 yypay:rounded-full",
                item.dotClassName,
              )}
            />
          )}
          {collapsed && hasCount && (
            <span
              aria-hidden
              className="yypay:absolute yypay:-right-2 yypay:-top-1.5 yypay:min-w-4 yypay:rounded-full yypay:bg-primary yypay:px-1 yypay:text-center yypay:text-[10px] yypay:font-bold yypay:leading-4 yypay:text-primary-foreground"
            >
              {item.count}
            </span>
          )}
        </span>

        <span
          className={cn(
            "yypay:flex-1 yypay:truncate yypay:whitespace-nowrap",
            collapsed && "yypay:sr-only",
          )}
        >
          {item.label}
        </span>

        {hasCount && (
          <>
            {!collapsed && (
              <span
                aria-hidden
                className={cn(
                  "yypay:text-xs yypay:font-semibold yypay:tabular-nums",
                  hasActions &&
                    "yypay:group-focus-within/item:invisible yypay:group-hover/item:invisible",
                )}
              >
                {item.count}
              </span>
            )}
            {item.countLabel && (
              <span className="yypay:sr-only">, {item.countLabel}</span>
            )}
          </>
        )}
      </Link>

      {hasActions && <NavItemActions item={item} />}
    </li>
  );
}

function SidebarFab({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { wallet, walletLoading, setWalletDialog } = useConsoleData();
  const { t } = useLocale();
  const label = wallet ? t.sidebar.rechargeWallet : t.sidebar.createWallet;
  const Icon = wallet ? Plus : Wallet;

  function handleClick() {
    onNavigate?.();
    if (pathname !== "/console") {
      router.push("/console");
    }
    setWalletDialog(wallet ? "recharge" : "create");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={walletLoading}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "yypay:flex yypay:h-14 yypay:shrink-0 yypay:items-center yypay:gap-3 yypay:rounded-2xl yypay:bg-fab yypay:text-sm yypay:font-semibold yypay:text-fab-foreground yypay:transition-[box-shadow,background-color] yypay:duration-200 yypay:hover:bg-fab-hover yypay:hover:shadow-fab yypay:disabled:cursor-wait yypay:disabled:opacity-70",
        collapsed
          ? "yypay:mx-auto yypay:w-14 yypay:justify-center"
          : "yypay:ml-2 yypay:self-start yypay:pl-4 yypay:pr-6",
      )}
    >
      <Icon className="yypay:h-6 yypay:w-6 yypay:shrink-0" aria-hidden />
      {!collapsed && <span className="yypay:whitespace-nowrap">{label}</span>}
    </button>
  );
}

export function ConsoleSidebar({
  collapsed = false,
  onNavigate,
  className,
}: ConsoleSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const cartCount = useCartStore((state) => state.items.length);
  const clearCart = useCartStore((state) => state.clearCart);
  const [showMore, setShowMore] = useState(false);
  const filtersId = useId();

  const statusParam =
    pathname === "/console/transactions" ? searchParams.get("status") : null;

  const primary: NavItem[] = [
    {
      href: "/console",
      label: t.sidebar.overview,
      icon: LayoutDashboard,
      active: pathname === "/console",
    },
    {
      href: "/console/transactions",
      label: t.sidebar.transactions,
      icon: Receipt,
      active: pathname === "/console/transactions" && !statusParam,
    },
    {
      href: "/console/plans",
      label: t.sidebar.plans,
      icon: Tag,
      active: pathname === "/console/plans",
      count: cartCount,
      countLabel: t.sidebar.inCart(cartCount),
      actions: [
        {
          label: t.sidebar.clearCart,
          icon: Trash2,
          onSelect: () => {
            clearCart();
            toast.success(t.sidebar.cartCleared);
          },
        },
      ],
    },
  ];

  const statusFilters: NavItem[] = [
    {
      href: "/console/transactions?status=success",
      label: t.sidebar.statusSuccess,
      dotClassName: "yypay:bg-label-success",
      active: statusParam === "success",
    },
    {
      href: "/console/transactions?status=pending",
      label: t.sidebar.statusPending,
      dotClassName: "yypay:bg-label-pending",
      active: statusParam === "pending",
    },
    {
      href: "/console/transactions?status=failed",
      label: t.sidebar.statusFailed,
      dotClassName: "yypay:bg-label-failed",
      active: statusParam === "failed",
    },
  ];

  const account: NavItem[] = [
    {
      href: "/organizations",
      label: t.sidebar.switchOrganization,
      icon: Building2,
      active: pathname === "/organizations",
    },
    {
      href: "/tenants",
      label: t.sidebar.switchTenant,
      icon: Server,
      active: pathname === "/tenants",
    },
  ];

  // Un filtre actif reste toujours visible, même si la section est repliée.
  const filtersVisible = showMore || statusFilters.some((item) => item.active);

  return (
    <nav
      aria-label={t.sidebar.mainMenu}
      className={cn("yypay:flex yypay:flex-col yypay:gap-4 yypay:py-2", className)}
    >
      <SidebarFab collapsed={collapsed} onNavigate={onNavigate} />

      <div className={cn("yypay:flex yypay:flex-col yypay:gap-0.5", !collapsed && "yypay:pr-3")}>
        <ul className="yypay:flex yypay:flex-col yypay:gap-0.5">
          {primary.map((item) => (
            <SidebarNavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setShowMore((value) => !value)}
          aria-expanded={filtersVisible}
          aria-controls={filtersId}
          title={collapsed ? (filtersVisible ? t.sidebar.less : t.sidebar.more) : undefined}
          className={cn(
            "yypay:flex yypay:h-8 yypay:items-center yypay:gap-4 yypay:rounded-full yypay:text-sm yypay:text-nav-foreground yypay:transition-colors yypay:hover:bg-nav-hover",
            collapsed
              ? "yypay:mx-auto yypay:w-14 yypay:justify-center"
              : "yypay:pl-6 yypay:pr-3",
          )}
        >
          {filtersVisible ? (
            <ChevronUp className="yypay:h-5 yypay:w-5 yypay:shrink-0" aria-hidden />
          ) : (
            <ChevronDown className="yypay:h-5 yypay:w-5 yypay:shrink-0" aria-hidden />
          )}
          <span className={cn(collapsed && "yypay:sr-only")}>
            {filtersVisible ? t.sidebar.less : t.sidebar.more}
          </span>
        </button>
      </div>

      <section
        id={filtersId}
        hidden={!filtersVisible}
        aria-labelledby={`${filtersId}-title`}
        className={cn(!collapsed && "yypay:pr-3")}
      >
        <h2
          id={`${filtersId}-title`}
          className={cn(
            "yypay:mb-1 yypay:pl-6 yypay:text-base yypay:font-medium yypay:text-foreground",
            collapsed && "yypay:sr-only",
          )}
        >
          {t.sidebar.statusFilters}
        </h2>
        <ul className="yypay:flex yypay:flex-col yypay:gap-0.5">
          {statusFilters.map((item) => (
            <SidebarNavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </section>

      <section
        aria-labelledby={`${filtersId}-account`}
        className={cn(!collapsed && "yypay:pr-3")}
      >
        <h2
          id={`${filtersId}-account`}
          className={cn(
            "yypay:mb-1 yypay:pl-6 yypay:text-base yypay:font-medium yypay:text-foreground",
            collapsed && "yypay:sr-only",
          )}
        >
          {t.sidebar.account}
        </h2>
        <ul className="yypay:flex yypay:flex-col yypay:gap-0.5">
          {account.map((item) => (
            <SidebarNavLink
              key={item.href}
              item={item}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      </section>
    </nav>
  );
}
