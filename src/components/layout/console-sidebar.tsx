"use client";

import { cn } from "@/lib/utils";
import {
  Building2,
  LayoutDashboard,
  Receipt,
  Server,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ConsoleSidebarProps = {
  onNavigate?: () => void;
  className?: string;
};

const sections = [
  { href: "/console", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/console/transactions", label: "Transactions", icon: Receipt },
  { href: "/console/plans", label: "Plans disponibles", icon: Tag },
];

const account = [
  { href: "/organizations", label: "Changer d'organisation", icon: Building2 },
  { href: "/tenants", label: "Changer de tenant", icon: Server },
];

export function ConsoleSidebar({ onNavigate, className }: ConsoleSidebarProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("yypay:flex yypay:h-full yypay:flex-col yypay:gap-6", className)}>
      <div>
        <p className="yypay:mb-2 yypay:px-3 yypay:text-xs yypay:font-semibold yypay:uppercase yypay:tracking-wide yypay:text-muted-foreground">
          Navigation
        </p>
        <ul className="yypay:space-y-1">
          {sections.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    "yypay:flex yypay:items-center yypay:gap-3 yypay:rounded-lg yypay:px-3 yypay:py-2 yypay:text-sm yypay:font-medium yypay:text-muted-foreground yypay:transition-colors hover:yypay:bg-muted hover:yypay:text-foreground",
                    isActive && "yypay:bg-muted yypay:text-foreground",
                  )}
                >
                  <Icon className="yypay:h-4 yypay:w-4 yypay:shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <p className="yypay:mb-2 yypay:px-3 yypay:text-xs yypay:font-semibold yypay:uppercase yypay:tracking-wide yypay:text-muted-foreground">
          Compte
        </p>
        <ul className="yypay:space-y-1">
          {account.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                className="yypay:flex yypay:items-center yypay:gap-3 yypay:rounded-lg yypay:px-3 yypay:py-2 yypay:text-sm yypay:font-medium yypay:text-muted-foreground yypay:transition-colors hover:yypay:bg-muted hover:yypay:text-foreground"
              >
                <Icon className="yypay:h-4 yypay:w-4 yypay:shrink-0" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
