import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fr from "@/i18n/messages/fr";
import {
  countActivityByStatus,
  formatActivityDate,
  formatActivityStatusLabel,
  formatActivityType,
  getActivityStatusGroup,
  getActivityStatusVariant,
  sortActivityItems,
  type PaymentActivityItem,
} from "@/lib/payment-activity";

function item(overrides: Partial<PaymentActivityItem>): PaymentActivityItem {
  return {
    id: "id",
    source: "wallet",
    type: "CREDIT",
    status: "SUCCESS",
    ...overrides,
  };
}

describe("getActivityStatusGroup", () => {
  it("groups provider statuses, case-insensitively", () => {
    assert.equal(getActivityStatusGroup("recharged"), "success");
    assert.equal(getActivityStatusGroup(" PENDING_PAYMENT "), "pending");
    assert.equal(getActivityStatusGroup("CANCELED"), "failed");
    assert.equal(getActivityStatusGroup("SOMETHING_ELSE"), "other");
    assert.equal(getActivityStatusGroup(undefined), "other");
  });

  it("maps groups to badge variants", () => {
    assert.equal(getActivityStatusVariant("PAID"), "success");
    assert.equal(getActivityStatusVariant("EXPIRED"), "destructive");
    assert.equal(getActivityStatusVariant("PROCESSING"), "secondary");
  });
});

describe("countActivityByStatus", () => {
  it("counts every status group", () => {
    const counts = countActivityByStatus([
      item({ status: "SUCCESS" }),
      item({ status: "ACTIVE" }),
      item({ status: "PENDING" }),
      item({ status: "FAILED" }),
      item({ status: "WEIRD" }),
    ]);
    assert.deepEqual(counts, { success: 2, pending: 1, failed: 1, other: 1 });
  });
});

describe("sortActivityItems", () => {
  it("puts the most recent first and undated items last, without mutating", () => {
    const input = [
      item({ id: "old", createdAt: "2026-01-01T00:00:00Z" }),
      item({ id: "none" }),
      item({ id: "new", createdAt: "2026-06-01T00:00:00Z" }),
    ];
    const sorted = sortActivityItems(input).map((entry) => entry.id);
    assert.deepEqual(sorted, ["new", "old", "none"]);
    assert.equal(input[0].id, "old");
  });
});

describe("labels", () => {
  it("translates known statuses and keeps unknown ones verbatim", () => {
    assert.equal(formatActivityStatusLabel("RECHARGED", fr), "Rechargé");
    assert.equal(formatActivityStatusLabel("ON_HOLD", fr), "ON_HOLD");
    assert.equal(formatActivityStatusLabel(undefined, fr), "Inconnu");
  });

  it("describes each activity source", () => {
    assert.equal(formatActivityType(item({ source: "recharge_order" }), fr), "Recharge wallet");
    assert.equal(
      formatActivityType(item({ source: "plan_order", type: "PLAN_STARTER" }), fr),
      "Plan STARTER",
    );
  });

  it("returns placeholders for missing or invalid dates", () => {
    assert.deepEqual(formatActivityDate(undefined, "fr-FR"), { date: "-", time: "" });
    assert.deepEqual(formatActivityDate("invalide", "fr-FR"), { date: "-", time: "" });
    assert.notEqual(formatActivityDate("2026-11-13T10:30:00Z", "fr-FR").date, "-");
  });
});
