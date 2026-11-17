import { describe, expect, it } from "vitest";
import {
  daysLeft,
  formatDay,
  formatMoney,
  isNearLimit,
  plural,
  priceOf,
  usageRatio,
  whatsappTrial,
} from "./billingFormat";

const now = new Date("2026-11-16T12:00:00Z");

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

describe("the WhatsApp trial", () => {
  it("counts the days left, rounding up, never below zero", () => {
    expect(daysLeft(new Date("2026-11-17T11:00:00Z"), now)).toBe(1);
    expect(daysLeft(new Date("2026-11-30T12:00:00Z"), now)).toBe(14);
    expect(daysLeft(new Date("2026-11-01T12:00:00Z"), now)).toBe(0);
    expect(daysLeft(undefined, now)).toBeNull();
  });

  it("is running, over, or absent for a paid plan or one never started", () => {
    expect(
      whatsappTrial(
        { plan: "FREE", whatsappTrialEndsAt: new Date("2026-11-20T12:00:00Z") },
        now,
      ),
    ).toEqual({ daysLeft: 4, over: false });
    expect(
      whatsappTrial(
        { plan: "FREE", whatsappTrialEndsAt: new Date("2026-11-10T12:00:00Z") },
        now,
      ),
    ).toEqual({ daysLeft: 0, over: true });
    expect(
      whatsappTrial({ plan: "FREE", whatsappTrialEndsAt: undefined }, now),
    ).toBeNull();
    expect(
      whatsappTrial(
        {
          plan: "CHURCH",
          whatsappTrialEndsAt: new Date("2026-11-20T12:00:00Z"),
        },
        now,
      ),
    ).toBeNull();
  });
});

describe("small helpers", () => {
  it("pluralizes", () => {
    expect(plural(1, "día", "días")).toBe("1 día");
    expect(plural(3, "día", "días")).toBe("3 días");
  });

  it("finds the price list of a country", () => {
    const billing = { prices: [{ country: "PE" as const, monthly: 75 }] };
    expect(priceOf(billing, "PE")?.monthly).toBe(75);
    expect(priceOf(billing, "CO")).toBeUndefined();
  });
});
