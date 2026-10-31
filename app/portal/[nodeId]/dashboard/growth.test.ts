import { describe, expect, it } from "vitest";
import {
  bucketLabel,
  bucketLongLabel,
  dayLabel,
  dayLongLabel,
  monthLabel,
  monthLongLabel,
} from "./growth";

describe("monthLabel", () => {
  it("shortens the month in Spanish", () => {
    expect(monthLabel("2026-10")).toBe("oct 26");
    expect(monthLongLabel("2026-10")).toBe("octubre de 2026");
  });

  it("keeps what it cannot read", () => {
    expect(monthLabel("nope")).toBe("nope");
    expect(monthLabel(undefined)).toBe("");
    expect(monthLongLabel(undefined)).toBe("");
  });
});

describe("dayLabel", () => {
  it("shortens the day in Spanish", () => {
    expect(dayLabel("2026-10-01")).toBe("1 oct");
    expect(dayLongLabel("2026-10-01")).toBe("1 de octubre de 2026");
  });

  it("keeps what it cannot read", () => {
    expect(dayLabel("nope")).toBe("nope");
    expect(dayLabel(undefined)).toBe("");
    expect(dayLongLabel(undefined)).toBe("");
  });
});

describe("bucketLabel", () => {
  it("reads a monthly bucket ('yyyy-MM')", () => {
    expect(bucketLabel("2026-10")).toBe("oct 26");
    expect(bucketLongLabel("2026-10")).toBe("octubre de 2026");
  });

  it("reads a daily or weekly bucket ('yyyy-MM-dd')", () => {
    expect(bucketLabel("2026-10-01")).toBe("1 oct");
    expect(bucketLongLabel("2026-10-01")).toBe("1 de octubre de 2026");
  });

  it("returns an empty string without a label", () => {
    expect(bucketLabel(undefined)).toBe("");
    expect(bucketLongLabel(undefined)).toBe("");
  });
});
