import { describe, expect, it } from "vitest";
import { visibleHours } from "./programHours";

describe("visibleHours", () => {
  it("shows from 07:00 to 22:00 when the sessions fit", () => {
    expect(
      visibleHours([
        { start: new Date(2026, 10, 13, 9), end: new Date(2026, 10, 13, 11) },
      ]),
    ).toEqual({ slotMinTime: "07:00:00", slotMaxTime: "22:00:00" });
    expect(visibleHours([])).toEqual({
      slotMinTime: "07:00:00",
      slotMaxTime: "22:00:00",
    });
  });

  it("starts earlier when a session does", () => {
    expect(
      visibleHours([
        {
          start: new Date(2026, 10, 13, 5, 30),
          end: new Date(2026, 10, 13, 7),
        },
      ]).slotMinTime,
    ).toBe("05:00:00");
  });

  it("ends later when a session does, rounding up to the hour", () => {
    expect(
      visibleHours([
        {
          start: new Date(2026, 10, 13, 20),
          end: new Date(2026, 10, 13, 22, 30),
        },
      ]).slotMaxTime,
    ).toBe("23:00:00");
  });

  it("goes to midnight for a session that runs past it", () => {
    expect(
      visibleHours([
        { start: new Date(2026, 10, 13, 22), end: new Date(2026, 10, 14, 6) },
      ]).slotMaxTime,
    ).toBe("24:00:00");
  });
});
