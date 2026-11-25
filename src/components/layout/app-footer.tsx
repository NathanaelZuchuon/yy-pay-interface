"use client";

import { useLocale } from "@/i18n/locale-provider";
import { cn } from "@/lib/utils";

const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION;
// Liens optionnels : affichés seulement s'ils sont configurés (.env).
const SUPPORT_URL = process.env.NEXT_PUBLIC_SUPPORT_URL;
const LEGAL_URL = process.env.NEXT_PUBLIC_LEGAL_URL;

export function AppFooter({ className }: { className?: string }) {
  const { t } = useLocale();
  const links = [
    SUPPORT_URL && { href: SUPPORT_URL, label: t.footer.support },
    LEGAL_URL && { href: LEGAL_URL, label: t.footer.legal },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <footer
      className={cn(
        "yypay:flex yypay:flex-col yypay:items-center yypay:justify-between yypay:gap-2 yypay:py-4 yypay:text-xs yypay:text-muted-foreground yypay:sm:flex-row",
        className,
      )}
    >
      <p>{t.footer.rights(new Date().getFullYear())}</p>
      <div className="yypay:flex yypay:flex-wrap yypay:items-center yypay:justify-center yypay:gap-x-4 yypay:gap-y-1">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="yypay:hover:text-foreground yypay:hover:underline"
          >
            {link.label}
          </a>
        ))}
        {APP_VERSION && <span>{t.footer.version(APP_VERSION)}</span>}
      </div>
    </footer>
  );
}
