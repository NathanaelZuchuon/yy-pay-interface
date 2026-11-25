import { cn } from "@/lib/utils";
import { Wallet } from "lucide-react";

/**
 * Identité visuelle YowYob Payment, centralisée ici : pour adopter le logo
 * officiel, il suffit de remplacer le contenu de `BrandMark` (SVG ou <Image>).
 */
export const BRAND_NAME = "YowYob Payment";

const MARK_SIZES = {
  sm: "yypay:h-8 yypay:w-8 yypay:rounded-lg",
  md: "yypay:h-9 yypay:w-9 yypay:rounded-lg",
  lg: "yypay:h-10 yypay:w-10 yypay:rounded-xl",
} as const;

const ICON_SIZES = {
  sm: "yypay:h-4 yypay:w-4",
  md: "yypay:h-5 yypay:w-5",
  lg: "yypay:h-5 yypay:w-5",
} as const;

type BrandSize = keyof typeof MARK_SIZES;

export function BrandMark({
  size = "md",
  className,
}: {
  size?: BrandSize;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "yypay:flex yypay:shrink-0 yypay:items-center yypay:justify-center yypay:bg-primary yypay:text-primary-foreground yypay:shadow-sm",
        MARK_SIZES[size],
        className,
      )}
    >
      <Wallet className={ICON_SIZES[size]} strokeWidth={2.25} />
    </span>
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
            "yypay:truncate yypay:font-semibold yypay:tracking-tight yypay:text-foreground",
            size === "sm" ? "yypay:text-sm" : "yypay:text-lg",
            nameClassName,
          )}
        >
          {BRAND_NAME}
        </span>
      ) : (
        <span className="yypay:sr-only">{BRAND_NAME}</span>
      )}
    </span>
  );
}
