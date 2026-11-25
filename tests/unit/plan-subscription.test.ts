import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fr from "@/i18n/messages/fr";
import {
  canPurchasePlan,
  formatPaidUntil,
  getActiveSubscription,
  getActiveSubscriptionLabel,
  getPendingPlanCodes,
  isSubscriptionStillValid,
} from "@/lib/plan-subscription";

const NOW = Date.parse("2026-11-13T12:00:00Z");
const FUTURE = "2026-12-13T12:00:00Z";
const PAST = "2026-10-13T12:00:00Z";

describe("isSubscriptionStillValid", () => {
  it("requires an active flag and a future paidUntil", () => {
    assert.equal(isSubscriptionStillValid({ active: true, paidUntil: FUTURE }, NOW), true);
    assert.equal(isSubscriptionStillValid({ active: true, paidUntil: PAST }, NOW), false);
    assert.equal(isSubscriptionStillValid({ active: false, paidUntil: FUTURE }, NOW), false);
    assert.equal(isSubscriptionStillValid({ active: true }, NOW), false);
  });
});

describe("getActiveSubscription", () => {
  it("returns the first still-valid subscription", () => {
    const active = { planCode: "PRO", active: true, paidUntil: FUTURE };
    assert.equal(
      getActiveSubscription([{ planCode: "OLD", active: true, paidUntil: PAST }, active], NOW),
      active,
    );
    assert.equal(getActiveSubscription([], NOW), undefined);
  });
});

describe("getActiveSubscriptionLabel", () => {
  it("prefers the plan display name, then the code", () => {
    const subscription = { planCode: "PRO" };
    assert.equal(
      getActiveSubscriptionLabel(subscription, [{ code: "PRO", displayName: "Professionnel" }], fr),
      "Professionnel",
    );
    assert.equal(getActiveSubscriptionLabel(subscription, [], fr), "PRO");
  });
});

describe("canPurchasePlan", () => {
  it("blocks a purchase while a subscription is still valid", () => {
    const result = canPurchasePlan(
      [{ planCode: "PRO", active: true, paidUntil: FUTURE }],
      [],
      fr,
      "fr-FR",
      NOW,
    );
    assert.equal(result.allowed, false);
    assert.match(result.reason ?? "", /PRO/);
  });

  it("allows a purchase when nothing is active", () => {
    assert.deepEqual(canPurchasePlan([], [], fr, "fr-FR", NOW), { allowed: true });
  });
});

describe("getPendingPlanCodes", () => {
  it("keeps only orders awaiting payment for the current organization", () => {
    const codes = getPendingPlanCodes(
      [
        { planCode: "A", status: "PENDING_PAYMENT", organizationId: "org-1" },
        { planCode: "B", status: "PENDING_PAYMENT", organizationId: "org-2" },
        { planCode: "C", status: "ACTIVE", organizationId: "org-1" },
      ],
      "org-1",
    );
    assert.deepEqual([...codes], ["A"]);
  });
});

describe("formatPaidUntil", () => {
  it("formats a valid date and rejects invalid ones", () => {
    assert.equal(formatPaidUntil("2026-12-13T12:00:00Z", "fr-FR"), "13 décembre 2026");
    assert.equal(formatPaidUntil("n'importe quoi", "fr-FR"), null);
    assert.equal(formatPaidUntil(undefined, "fr-FR"), null);
  });
});
