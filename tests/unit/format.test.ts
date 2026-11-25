import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { daysUntil, formatMoney, toIntlTag } from "@/i18n/format";

// Intl insère des espaces insécables (U+00A0 / U+202F) : on les normalise.
const plain = (value: string) => value.replace(/[  ]/g, " ");

describe("toIntlTag", () => {
  it("maps app locales to BCP 47 tags", () => {
    assert.equal(toIntlTag("fr"), "fr-FR");
    assert.equal(toIntlTag("en"), "en-US");
  });
});

describe("formatMoney", () => {
  it("formats XAF without decimals, with the currency", () => {
    assert.equal(plain(formatMoney(12500, "XAF", "fr-FR")), "12 500 FCFA");
  });

  it("defaults to XAF and treats a missing amount as zero", () => {
    assert.equal(plain(formatMoney(undefined, undefined, "fr-FR")), "0 FCFA");
  });

  it("keeps two decimals for euros", () => {
    assert.equal(plain(formatMoney(12.5, "eur", "fr-FR")), "12,50 €");
  });

  it("falls back to `<amount> <code>` for an invalid currency code", () => {
    assert.equal(plain(formatMoney(10, "NOT-A-CODE", "en-US")), "10 NOT-A-CODE");
  });
});

describe("daysUntil", () => {
  const now = Date.parse("2026-11-13T12:00:00Z");

  it("counts whole days remaining, rounding up", () => {
    assert.equal(daysUntil("2026-11-20T12:00:00Z", now), 7);
    assert.equal(daysUntil("2026-11-13T18:00:00Z", now), 1);
  });

  it("is negative for past dates", () => {
    assert.equal(daysUntil("2026-11-10T12:00:00Z", now), -3);
  });

  it("returns null for missing or invalid dates", () => {
    assert.equal(daysUntil(null, now), null);
    assert.equal(daysUntil("pas une date", now), null);
  });
});
