import { describe, expect, it } from "vitest";
import type {
  BillingResponse,
  PlanResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import {
  currentPlan,
  formatDay,
  formatMoney,
  isNearLimit,
  nextPlan,
  plural,
  planName,
  planTotal,
  priceOf,
  suggestedPlan,
  usageRatio,
} from "./billingFormat";

const price = (
  country: "PE" | "CO",
  monthly: number,
  yearly: number,
  ownNumberMonthly: number,
  ownNumberYearly: number,
) => ({
  country,
  currency: country === "PE" ? "PEN" : "COP",
  monthly,
  yearly,
  ownNumberMonthly,
  ownNumberYearly,
});

const plan = (
  key: PlanResponse["plan"],
  fits: boolean,
  prices: PlanResponse["prices"] = [],
): PlanResponse => ({ plan: key, label: String(key), fits, prices });

const plans = [
  plan("FREE", true),
  plan("BASIC", true, [
    price("PE", 45, 450, 49, 490),
    price("CO", 49000, 490000, 49000, 490000),
  ]),
  plan("CHURCH", true, [price("PE", 75, 750, 49, 490)]),
  plan("NETWORK", true, [price("PE", 149, 1490, 49, 490)]),
];

const billing = (
  overrides: Partial<BillingResponse> = {},
): BillingResponse => ({
  plan: "FREE",
  plans,
  ...overrides,
});

describe("formatMoney", () => {
  it("writes soles with cents and pesos without", () => {
    expect(formatMoney(75, "PEN")).toMatch(/S\/\s?75[.,]00/);
    expect(formatMoney(85000, "COP")).toMatch(/85[.,\s]000/);
    expect(formatMoney(85000, "COP")).not.toMatch(/,00/);
  });
});

describe("formatDay", () => {
  it("reads a date-only value as that day, not the day before", () => {
    expect(formatDay("2026-12-15")).toContain("15");
    expect(formatDay("2026-12-15").toLowerCase()).toContain("diciembre");
  });

  it("is empty without a date", () => {
    expect(formatDay(undefined)).toBe("");
    expect(formatDay("nope")).toBe("");
  });
});

describe("usage", () => {
  it("is a ratio capped at one, and nothing without a maximum", () => {
    expect(usageRatio(25, 50)).toBe(0.5);
    expect(usageRatio(80, 50)).toBe(1);
    expect(usageRatio(10, undefined)).toBeNull();
    expect(usageRatio(undefined, 50)).toBe(0);
  });

  it("warns from 80 % of the maximum", () => {
    expect(isNearLimit(39, 50)).toBe(false);
    expect(isNearLimit(40, 50)).toBe(true);
    expect(isNearLimit(50, 50)).toBe(true);
    expect(isNearLimit(500, undefined)).toBe(false);
  });
});

describe("the plans", () => {
  it("names each plan", () => {
    expect(planName("BASIC")).toBe("Básico");
    expect(planName("NETWORK")).toBe("Red");
    expect(planName("NEW")).toBe("NEW");
    expect(planName(undefined)).toBe("");
  });

  it("finds the plan in force and the next one", () => {
    expect(currentPlan(billing({ plan: "BASIC" }))?.plan).toBe("BASIC");
    expect(nextPlan(billing({ plan: "FREE" }))?.plan).toBe("BASIC");
    expect(nextPlan(billing({ plan: "CHURCH" }))?.plan).toBe("NETWORK");
    expect(nextPlan(billing({ plan: "NETWORK" }))).toBeUndefined();
    expect(nextPlan({ plan: "FREE" })).toBeUndefined();
  });

  it("finds the price of a country, and none for the free plan", () => {
    expect(priceOf(plans[1], "PE")?.monthly).toBe(45);
    expect(priceOf(plans[1], "AR")).toBeUndefined();
    expect(priceOf(plans[0], "PE")).toBeUndefined();
    expect(priceOf(undefined, "PE")).toBeUndefined();
  });

  it("adds the extra number to a month or a year only when asked", () => {
    expect(planTotal(plans[1]!, "PE", 1, false)).toBe(45);
    expect(planTotal(plans[1]!, "PE", 1, true)).toBe(94);
    expect(planTotal(plans[1]!, "PE", 12, false)).toBe(450);
    expect(planTotal(plans[1]!, "CO", 12, true)).toBe(980000);
    expect(planTotal(plans[2]!, "CO", 1, false)).toBeNull();
  });

  it("suggests the plan in force, or the cheapest one that fits", () => {
    expect(suggestedPlan(billing({ plan: "CHURCH" }))?.plan).toBe("CHURCH");
    expect(suggestedPlan(billing())?.plan).toBe("BASIC");
    const tooBig = billing({
      plans: [plans[0]!, { ...plans[1]!, fits: false }, plans[2]!, plans[3]!],
    });
    expect(suggestedPlan(tooBig)?.plan).toBe("CHURCH");
    const nothingFits = billing({
      plans: plans.map((p) => ({ ...p, fits: false })),
    });
    expect(suggestedPlan(nothingFits)?.plan).toBe("NETWORK");
  });
});

describe("plural", () => {
  it("pluralizes", () => {
    expect(plural(1, "día", "días")).toBe("1 día");
    expect(plural(3, "día", "días")).toBe("3 días");
  });
});
