"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
import { CartSheet } from "@/components/cart/cart-sheet";
import { LanguageToggle } from "@/components/language/language-toggle";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/i18n/locale-provider";
import { bffPost } from "@/lib/bff-client";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { CircleHelp, LogOut, Menu, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ConsoleHeaderProps = {
  walletName?: string | null;
  onCheckoutComplete?: () => void;
  onOpenHelp?: () => void;
  /** Bouton ☰ : réduit/agrandit la sidebar (desktop) ou ouvre le tiroir (mobile). */
  onMenuClick?: () => void;
  menuLabel?: string;
  menuExpanded?: boolean;
  menuControls?: string;
};

export function ConsoleHeader({
  walletName,
  onCheckoutComplete,
  onOpenHelp,
  onMenuClick,
  menuLabel,
  menuExpanded,
  menuControls,
}: ConsoleHeaderProps) {
  const router = useRouter();
  const { t } = useLocale();
  const itemCount = useCartStore((state) => state.itemCount());

  async function handleLogout() {
    try {
      await bffPost("/api/auth/logout", {});
      toast.success(t.header.logoutSuccess);
      router.push("/");
    } catch {
      toast.error(t.header.logoutError);
    }
  }

  return (
    <header
      className={cn(
        "yypay:sticky yypay:top-0 yypay:z-40",
        // Avec sidebar (console) : fond « shell » continu façon Gmail ;
        // pages autonomes (tenants, organisations) : barre classique.
        onMenuClick
          ? "yypay:bg-shell"
          : "yypay:border-b yypay:border-border yypay:bg-card/95 yypay:backdrop-blur",
      )}
    >
      <div
        className={cn(
          "yypay:flex yypay:h-16 yypay:items-center yypay:justify-between yypay:gap-3",
          onMenuClick
            ? "yypay:pl-2 yypay:pr-3 yypay:sm:pr-4"
            : "yypay:mx-auto yypay:max-w-6xl yypay:px-4 yypay:sm:px-6",
        )}
      >
        <div className="yypay:flex yypay:min-w-0 yypay:items-center yypay:gap-1">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label={menuLabel ?? t.header.openNav}
              aria-expanded={menuExpanded}
              aria-controls={menuControls}
              title={menuLabel}
              className="yypay:flex yypay:h-12 yypay:w-12 yypay:shrink-0 yypay:items-center yypay:justify-center yypay:rounded-full yypay:text-nav-foreground yypay:transition-colors yypay:hover:bg-nav-hover"
            >
              <Menu className="yypay:h-6 yypay:w-6" aria-hidden />
            </button>
          )}
          <Link href="/console" className="yypay:min-w-0 yypay:rounded-lg yypay:px-1">
            <BrandLogo size="sm" nameClassName="yypay:text-lg" />
          </Link>
        </div>

        <div className="yypay:flex yypay:items-center yypay:gap-1 yypay:sm:gap-2">
          {onOpenHelp && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenHelp}
              aria-label={t.header.help}
            >
              <CircleHelp className="yypay:h-4 yypay:w-4" />
            </Button>
          )}
          <LanguageToggle />
          <ThemeToggle />
          <CartSheet
            walletName={walletName}
            trigger={
              <Button variant="outline" size="icon" className="yypay:relative">
                <ShoppingCart className="yypay:h-4 yypay:w-4" />
                {itemCount > 0 && (
                  <Badge className="yypay:absolute yypay:-right-2 yypay:-top-2 yypay:h-5 yypay:min-w-5 yypay:px-1">
                    {itemCount}
                  </Badge>
                )}
              </Button>
            }
            onCheckoutComplete={onCheckoutComplete}
          />
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label={t.header.logout}>
            <LogOut className="yypay:h-4 yypay:w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
