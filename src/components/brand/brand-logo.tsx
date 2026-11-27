"use client";

import { cn } from "@/lib/utils";
import { useId } from "react";

/**
 * Identité visuelle YowYob Payment.
 *
 * Le symbole est un « Y » formé de deux flux qui convergent vers un tronc
 * commun (plusieurs moyens de paiement → un seul compte), dans un carré
 * arrondi au dégradé de la couleur de marque. Le point clair au bout de la
 * branche droite évoque une transaction en mouvement.
 * Même dessin que l'icône d'onglet (`src/app/icon.svg`).
 */
export const BRAND_NAME = "YowYob Payment";

const MARK_SIZES = {
  sm: "yypay:h-8 yypay:w-8",
  md: "yypay:h-9 yypay:w-9",
  lg: "yypay:h-10 yypay:w-10",
} as const;

type BrandSize = keyof typeof MARK_SIZES;

export function BrandMark({
  size = "md",
  className,
}: {
  size?: BrandSize;
  className?: string;
}) {
  // Identifiant unique : plusieurs logos peuvent coexister sur une page.
  const gradientId = `yy-mark-${useId().replace(/:/g, "")}`;

  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      focusable="false"
      className={cn("yypay:shrink-0 yypay:drop-shadow-sm", MARK_SIZES[size], className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3D6BFF" />
          <stop offset="1" stopColor="#1238C9" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${gradientId})`} />
      <path
        d="M9.5 9.5 16 16.5v6.5M16 16.5l4.6-5"
        fill="none"
        stroke="#fff"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23.4" cy="8.6" r="2.2" fill="#8FE3FF" />
    </svg>
  );
}

export function BrandLogo({
  size = "md",
  showName = true,
  className,
  nameClassName,
}: {
  size?: BrandSize;
  showName?: boolean;
  className?: string;
  nameClassName?: string;
}) {
  return (
    <span className={cn("yypay:flex yypay:min-w-0 yypay:items-center yypay:gap-2.5", className)}>
      <BrandMark size={size} />
      {showName ? (
        <span
          className={cn(
            "yypay:truncate yypay:tracking-tight yypay:text-foreground",
            size === "sm" ? "yypay:text-base" : "yypay:text-lg",
            nameClassName,
          )}
        >
          <span className="yypay:font-extrabold">YowYob</span>{" "}
          <span className="yypay:font-medium yypay:text-primary">Payment</span>
        </span>
      ) : (
        <span className="yypay:sr-only">{BRAND_NAME}</span>
      )}
    </span>
  );
}
