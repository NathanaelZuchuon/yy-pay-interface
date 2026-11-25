"use client";

import type { AggregatedQuote } from "@/components/cart/cart-types";
import { toIntlTag } from "@/i18n/format";
import { useLocale } from "@/i18n/locale-provider";

/** Détail ligne à ligne du devis calculé par le serveur. */
export function CartQuoteDetails({ quote }: { quote: AggregatedQuote | null }) {
  const { t, locale } = useLocale();
  const intlTag = toIntlTag(locale);

  if (!quote?.lines || quote.lines.length === 0) {
    return null;
  }

  return (
    <div className="yypay:mt-4 yypay:rounded-lg yypay:border yypay:border-border yypay:p-3 yypay:text-sm yypay:text-secondary">
      <p className="yypay:mb-2 yypay:font-medium yypay:text-foreground">
        {t.cart.quoteDetails}
      </p>
      <ul className="yypay:space-y-1">
        {quote.lines.map((line, index) => (
          <li
            key={`${line.serviceCode}-${index}`}
            className="yypay:flex yypay:justify-between yypay:gap-2"
          >
            <span>{line.serviceCode}</span>
            <span>
              {line.amount?.toLocaleString(intlTag)} {line.currency}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
