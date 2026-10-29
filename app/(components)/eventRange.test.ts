import { describe, expect, it } from "vitest";
import { eventRange, lastsSeveralDays } from "./eventRange";

describe("eventRange", () => {
  it("puts the chosen day together with the start and end times", () => {
    // The pickers still carry the day they were opened on (the 3rd).
    const range = eventRange({
      date: new Date(2026, 9, 23),
      endDate: null,
      startTime: new Date(2026, 9, 3, 18, 30, 45),
      endTime: new Date(2026, 9, 3, 20, 0),
    });

    expect(range.start).toEqual(new Date(2026, 9, 23, 18, 30));
    expect(range.end).toEqual(new Date(2026, 9, 23, 20, 0));
  });

  it("ends on the last day when the event lasts several days", () => {
    const range = eventRange({
      date: new Date(2026, 9, 23),
      endDate: new Date(2026, 9, 25),
      startTime: new Date(2026, 9, 23, 9, 0),
      endTime: new Date(2026, 9, 23, 13, 0),
    });

    expect(range.start).toEqual(new Date(2026, 9, 23, 9, 0));
    expect(range.end).toEqual(new Date(2026, 9, 25, 13, 0));
  });
});

describe("lastsSeveralDays", () => {
  const date = new Date(2026, 9, 23, 9, 0);

  it("is false without an end date or on the same day", () => {
    expect(lastsSeveralDays({ date, endDate: null })).toBe(false);
    expect(lastsSeveralDays({ date, endDate: new Date(2026, 9, 23, 22) })).toBe(
      false,
    );
  });

  it("is true when the end date is another day", () => {
    expect(lastsSeveralDays({ date, endDate: new Date(2026, 9, 24) })).toBe(
      true,
    );
  });
});
