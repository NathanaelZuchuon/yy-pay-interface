"use client";

import { CartSheet } from "@/components/cart/cart-sheet";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { bffPost } from "@/lib/bff-client";
import { useCartStore } from "@/stores/cart-store";
import { CircleHelp, LogOut, Menu, ShoppingCart, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

type ConsoleHeaderProps = {
  title?: string;
  walletName?: string | null;
  onCheckoutComplete?: () => void;
  sidebar?: ReactNode;
  onOpenHelp?: () => void;
};

export function ConsoleHeader({
  title = "Console",
  walletName,
  onCheckoutComplete,
  sidebar,
  onOpenHelp,
}: ConsoleHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const itemCount = useCartStore((state) => state.itemCount());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setSidebarOpen(false);
  }

  async function handleLogout() {
    try {
      await bffPost("/api/auth/logout", {});
      toast.success("Déconnexion réussie");
      router.push("/login");
    } catch {
      toast.error("Erreur lors de la déconnexion");
    }
  }

  return (
    <header className="yypay:sticky yypay:top-0 yypay:z-40 yypay:border-b yypay:border-border yypay:bg-card/95 yypay:backdrop-blur">
      <div className="yypay:mx-auto yypay:flex yypay:h-16 yypay:max-w-6xl yypay:items-center yypay:justify-between yypay:gap-3 yypay:px-4 sm:yypay:px-6">
        <div className="yypay:flex yypay:min-w-0 yypay:items-center yypay:gap-1">
          {sidebar && (
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="yypay:shrink-0 lg:yypay:hidden"
                  aria-label="Ouvrir la navigation"
                >
                  <Menu className="yypay:h-5 yypay:w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="yypay:w-72">
                <SheetHeader>
                  <SheetTitle>Navigation</SheetTitle>
                </SheetHeader>
                <div className="yypay:overflow-y-auto yypay:px-4 yypay:pb-6">
                  {sidebar}
                </div>
              </SheetContent>
            </Sheet>
          )}
          <Link
            href="/console"
            className="yypay:flex yypay:min-w-0 yypay:items-center yypay:gap-2"
          >
            <span className="yypay:flex yypay:h-8 yypay:w-8 yypay:shrink-0 yypay:items-center yypay:justify-center yypay:rounded-lg yypay:bg-primary yypay:text-primary-foreground">
              <Wallet className="yypay:h-4 yypay:w-4" />
            </span>
            <span className="yypay:truncate yypay:font-semibold yypay:text-foreground">
              YowYob Payment
            </span>
            <span className="yypay:hidden yypay:text-muted-foreground sm:yypay:inline">
              / {title}
            </span>
          </Link>
        </div>

        <div className="yypay:flex yypay:items-center yypay:gap-1 sm:yypay:gap-2">
          {onOpenHelp && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenHelp}
              aria-label="Revoir la présentation"
            >
              <CircleHelp className="yypay:h-4 yypay:w-4" />
            </Button>
          )}
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
          <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Se déconnecter">
            <LogOut className="yypay:h-4 yypay:w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
