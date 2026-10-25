import { describe, expect, it } from "vitest";
import { eventWhen } from "./eventWhen";

describe("eventWhen", () => {
  it("writes a one-off event with its hours", () => {
    expect(
      eventWhen({
        start: new Date(2030, 0, 5, 10, 0),
        end: new Date(2030, 0, 5, 12, 30),
      }),
    ).toBe("sábado 5 de enero de 2030, 10:00 a 12:30");
  });

  it("writes only the start when there is no end", () => {
    expect(eventWhen({ start: new Date(2030, 0, 5, 9, 5) })).toBe(
      "sábado 5 de enero de 2030, 09:05",
    );
  });

  it("writes a repeating event by its rule, with the hours", () => {
    expect(
      eventWhen({
        start: new Date(2026, 0, 5, 19, 0),
        end: new Date(2026, 0, 5, 21, 0),
        recurrence: {
          frequency: "WEEKLY",
          interval: 1,
          daysOfWeek: [3, 1],
          endType: "UNTIL",
          until: "2026-01-14",
        },
      }),
    ).toBe(
      "Semanalmente el lunes y miércoles, hasta el 14 de enero de 2026, 19:00 a 21:00",
    );
  });

  it("writes a repeating event that never ends", () => {
    expect(
      eventWhen({
        start: new Date(2026, 0, 5, 19, 0),
        recurrence: { frequency: "DAILY", interval: 1, endType: "NEVER" },
      }),
    ).toBe("Todos los días, 19:00");
  });

  it("reads as nothing without a start", () => {
    expect(eventWhen({})).toBe("");
  });
});
