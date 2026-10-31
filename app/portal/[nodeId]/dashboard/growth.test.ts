import { describe, expect, it } from "vitest";
import {
  bucketLabel,
  bucketLongLabel,
  compositionSegments,
  dayLabel,
  dayLongLabel,
  monthLabel,
  monthLongLabel,
  percentDelta,
  sumBuckets,
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

describe("sumBuckets", () => {
  it("adds up a field across every bucket", () => {
    const buckets = [{ joined: 2 }, { joined: 3 }, { joined: undefined }];
    expect(sumBuckets(buckets, (b) => b.joined)).toBe(5);
  });

  it("returns 0 for an empty list", () => {
    expect(sumBuckets([], (b: { joined?: number }) => b.joined)).toBe(0);
  });
});

describe("percentDelta", () => {
  it("computes the percentage change", () => {
    expect(percentDelta(120, 100)).toBe(20);
    expect(percentDelta(80, 100)).toBe(-20);
  });

  it("returns null when there is nothing to compare against", () => {
    expect(percentDelta(5, 0)).toBeNull();
  });

  it("returns 0 when both periods are empty", () => {
    expect(percentDelta(0, 0)).toBe(0);
  });
});

describe("compositionSegments", () => {
  it("splits the cumulative counts into exclusive groups", () => {
    expect(
      compositionSegments({ visitors: 50, attendees: 30, members: 10 }),
    ).toEqual({ members: 10, inProgress: 20, visitorsOnly: 20 });
  });

  it("treats missing counts as 0", () => {
    expect(compositionSegments({})).toEqual({
      members: 0,
      inProgress: 0,
      visitorsOnly: 0,
    });
  });
});
