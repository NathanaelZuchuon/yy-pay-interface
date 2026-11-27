import assert from "node:assert/strict";
import { describe, it } from "node:test";
import en from "@/i18n/messages/en";
import fr from "@/i18n/messages/fr";
import {
  computeYearlySavings,
  formatAddOnLabel,
  formatFeatureLabel,
  formatPlanPrice,
  getPlanDescription,
  getPlanFeatures,
  getTargetTypeLabel,
  humanizeCode,
} from "@/lib/commercial-plan-display";

const plain = (value: string) => value.replace(/[  ]/g, " ");

describe("humanizeCode", () => {
  it("turns technical codes into readable labels", () => {
    assert.equal(humanizeCode("INVENTORY_OPERATIONS_ADDON"), "Inventory operations");
    assert.equal(humanizeCode("SOME_NEW_MODULE"), "Some new module");
    assert.equal(humanizeCode(""), "");
  });
});

describe("option and feature labels", () => {
  it("translates known add-ons in both languages", () => {
    assert.equal(formatAddOnLabel("HRM_PAYROLL_ADDON", fr), "Paie et RH");
    assert.equal(formatAddOnLabel("HRM_PAYROLL_ADDON", en), "Payroll & HR");
  });

  it("never shows a raw code for an unknown add-on", () => {
    assert.equal(formatAddOnLabel("LOYALTY_POINTS_ADDON", fr), "Loyalty points");
  });

  it("looks up services, then packs, then add-ons", () => {
    assert.equal(formatFeatureLabel("HRM", fr), "Ressources humaines");
    assert.equal(formatFeatureLabel("OPERATIONS_PACK", fr), "Pack opérations");
    assert.equal(formatFeatureLabel("NOTIFICATION_ADDON", fr), "Notifications");
  });

  it("deduplicates features sharing a label", () => {
    assert.deepEqual(
      getPlanFeatures({ packCodes: ["OPERATIONS_PACK"], serviceCodes: ["HR", "HRM", "PRODUCT"] }, fr),
      ["Pack opérations", "Ressources humaines", "Produits"],
    );
  });

  it("labels target customers, with a readable fallback", () => {
    assert.equal(getTargetTypeLabel("SMB", fr), "PME");
    assert.equal(getTargetTypeLabel("NON_PROFIT", fr), "Non profit");
    assert.equal(getTargetTypeLabel(undefined, fr), null);
    assert.equal(getTargetTypeLabel("BOTH", fr), null);
  });
});

describe("getPlanDescription", () => {
  it("prefers the translated description of a known plan", () => {
    assert.match(
      getPlanDescription({ code: "STARTER", description: "Commercial identity and third-party foundation." }, fr) ?? "",
      /Identité commerciale/,
    );
  });

  it("falls back to the API text, then to null", () => {
    assert.equal(getPlanDescription({ code: "CUSTOM", description: " Sur mesure " }, fr), "Sur mesure");
    assert.equal(getPlanDescription({ code: "CUSTOM" }, fr), null);
  });
});

describe("formatPlanPrice", () => {
  it("splits amount and period", () => {
    const price = formatPlanPrice(10000, "XAF", "YEARLY", fr, "fr-FR");
    assert.equal(plain(price?.amount ?? ""), "10 000 FCFA");
    assert.equal(price?.period, "/ an");
    assert.equal(formatPlanPrice(undefined, "XAF", "MONTHLY", fr, "fr-FR"), null);
  });
});

describe("computeYearlySavings", () => {
  it("compares the yearly price with twelve monthly payments", () => {
    assert.deepEqual(computeYearlySavings(1000, 10000), { amount: 2000, percent: 17 });
  });

  it("returns null when yearly is not cheaper or a price is missing", () => {
    assert.equal(computeYearlySavings(1000, 12000), null);
    assert.equal(computeYearlySavings(1000, 13000), null);
    assert.equal(computeYearlySavings(undefined, 10000), null);
    assert.equal(computeYearlySavings(0, 0), null);
  });
});
