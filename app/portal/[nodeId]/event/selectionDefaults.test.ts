import { describe, expect, it } from "vitest";
import { initialRange } from "./selectionDefaults";

describe("initialRange", () => {
  it("keeps the hours of a range inside one day", () => {
    const start = new Date(2026, 9, 23, 18, 0);
    const end = new Date(2026, 9, 23, 19, 30);

    expect(initialRange({ start, end })).toEqual({
      date: start,
      endDate: null,
      startTime: start,
      endTime: end,
    });
  });

  it("starts a multi-day event when the range crosses days", () => {
    const start = new Date(2026, 9, 23, 18, 0);
    const end = new Date(2026, 9, 25, 12, 0);

    const range = initialRange({ start, end });

    expect(range.endDate).toEqual(end);
    expect(range.endTime).toEqual(end);
  });

  it("ends the day before when the range stops at midnight", () => {
    const start = new Date(2026, 9, 23, 18, 0);
    const end = new Date(2026, 9, 24, 0, 0);

    expect(initialRange({ start, end }).endDate).toBeNull();
  });

  it("starts a multi-day event from days picked in the all-day row", () => {
    // Three days: 23, 24 and 25; the selection ends on the 26th.
    const range = initialRange({
      start: new Date(2026, 9, 23),
      end: new Date(2026, 9, 26),
      allDay: true,
    });

    expect(range.date).toEqual(new Date(2026, 9, 23));
    expect(range.endDate).toEqual(new Date(2026, 9, 25));
    expect(range.startTime).toEqual(new Date(2026, 9, 23, 9, 0));
    expect(range.endTime).toEqual(new Date(2026, 9, 25, 13, 0));
  });

  it("keeps a single day picked in the all-day row as a single day", () => {
    const range = initialRange({
      start: new Date(2026, 9, 23),
      end: new Date(2026, 9, 24),
      allDay: true,
    });

    expect(range.endDate).toBeNull();
    expect(range.endTime).toEqual(new Date(2026, 9, 23, 13, 0));
  });
});
