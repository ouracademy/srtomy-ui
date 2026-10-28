import { describe, expect, it } from "vitest";
import {
  describeRecurrence,
  fromRecurrenceResponse,
  noRecurrence,
  nthWeekdayLabel,
  recurrencePreset,
  recurrenceSchema,
  toRecurrenceRequest,
  unitLabel,
  type RecurrenceFormData,
} from "./recurrence";

// 2026-10-23 is the fourth Friday of October.
const FRIDAY = new Date(2026, 9, 23, 18, 0);

const recurrence = (
  overrides: Partial<RecurrenceFormData>,
): RecurrenceFormData => ({ ...noRecurrence(), ...overrides });

describe("describeRecurrence", () => {
  it.each([
    [{}, "No se repite"],
    [{ frequency: "DAILY" as const }, "Todos los días"],
    [{ frequency: "DAILY" as const, interval: 3 }, "Cada 3 días"],
    [{ frequency: "WEEKLY" as const }, "Semanalmente el viernes"],
    [
      { frequency: "WEEKLY" as const, daysOfWeek: [0, 3, 1], interval: 2 },
      "Cada 2 semanas el lunes, miércoles y domingo",
    ],
    [{ frequency: "MONTHLY" as const }, "Mensualmente el día 23"],
    [
      { frequency: "MONTHLY" as const, monthlyMode: "NTH_WEEKDAY" as const },
      "Mensualmente el cuarto viernes",
    ],
    [{ frequency: "YEARLY" as const }, "Anualmente el 23 de octubre"],
    [
      { frequency: "YEARLY" as const, interval: 2 },
      "Cada 2 años el 23 de octubre",
    ],
  ])("describes %j", (overrides, expected) => {
    expect(describeRecurrence(recurrence(overrides), FRIDAY)).toBe(expected);
  });

  it("adds how it ends", () => {
    const daily = { frequency: "DAILY" as const };

    expect(
      describeRecurrence(
        recurrence({
          ...daily,
          endType: "UNTIL",
          until: new Date(2026, 11, 31),
        }),
        FRIDAY,
      ),
    ).toBe("Todos los días, hasta el 31 de diciembre de 2026");
    expect(
      describeRecurrence(recurrence({ ...daily, endType: "COUNT" }), FRIDAY),
    ).toBe("Todos los días, 10 veces");
    expect(
      describeRecurrence(
        recurrence({ ...daily, endType: "COUNT", count: 1 }),
        FRIDAY,
      ),
    ).toBe("Todos los días, 1 vez");
  });
});

describe("nthWeekdayLabel", () => {
  it("names the nth weekday of the month and the last one for the fifth", () => {
    expect(nthWeekdayLabel(new Date(2026, 9, 2))).toBe("primer viernes");
    expect(nthWeekdayLabel(new Date(2026, 9, 9))).toBe("segundo viernes");
    expect(nthWeekdayLabel(new Date(2026, 9, 30))).toBe("último viernes");
  });
});

describe("unitLabel", () => {
  it("is singular only for an interval of one", () => {
    expect(unitLabel("WEEKLY", 1)).toBe("semana");
    expect(unitLabel("WEEKLY", 2)).toBe("semanas");
    expect(unitLabel("MONTHLY", 1)).toBe("mes");
    expect(unitLabel("YEARLY", 3)).toBe("años");
  });
});

describe("toRecurrenceRequest", () => {
  it("is undefined when the event does not repeat", () => {
    expect(toRecurrenceRequest(noRecurrence(), FRIDAY)).toBeUndefined();
  });

  it("sends a weekly recurrence ending on a date", () => {
    expect(
      toRecurrenceRequest(
        recurrence({
          frequency: "WEEKLY",
          interval: 2,
          daysOfWeek: [1, 3],
          endType: "UNTIL",
          until: new Date(2026, 11, 31),
        }),
        FRIDAY,
      ),
    ).toEqual({
      frequency: "WEEKLY",
      interval: 2,
      daysOfWeek: [1, 3],
      monthlyMode: undefined,
      endType: "UNTIL",
      until: "2026-12-31",
      count: undefined,
    });
  });

  it("repeats on the weekday of the event when no weekday is chosen", () => {
    expect(
      toRecurrenceRequest(recurrence({ frequency: "WEEKLY" }), FRIDAY)
        ?.daysOfWeek,
    ).toEqual([5]);
  });

  it("sends the monthly mode and the count only where they apply", () => {
    expect(
      toRecurrenceRequest(
        recurrence({
          frequency: "MONTHLY",
          monthlyMode: "NTH_WEEKDAY",
          endType: "COUNT",
          count: 6,
        }),
        FRIDAY,
      ),
    ).toEqual({
      frequency: "MONTHLY",
      interval: 1,
      daysOfWeek: undefined,
      monthlyMode: "NTH_WEEKDAY",
      endType: "COUNT",
      until: undefined,
      count: 6,
    });
  });

  it("sends a recurrence that never ends without an end", () => {
    const request = toRecurrenceRequest(
      recurrence({ frequency: "DAILY" }),
      FRIDAY,
    );

    expect(request?.endType).toBe("NEVER");
    expect(request?.until).toBeUndefined();
    expect(request?.count).toBeUndefined();
  });
});

describe("fromRecurrenceResponse", () => {
  it("is no recurrence for an event that is not in a series", () => {
    expect(fromRecurrenceResponse(undefined)).toEqual(noRecurrence());
  });

  it("reads the recurrence of a series", () => {
    expect(
      fromRecurrenceResponse({
        frequency: "WEEKLY",
        interval: 2,
        daysOfWeek: [1, 3],
        endType: "UNTIL",
        until: "2026-12-31",
      }),
    ).toEqual({
      frequency: "WEEKLY",
      interval: 2,
      daysOfWeek: [1, 3],
      monthlyMode: "DAY_OF_MONTH",
      endType: "UNTIL",
      until: new Date(2026, 11, 31),
      count: 10,
    });
  });
});

describe("recurrenceSchema", () => {
  const messages = (value: RecurrenceFormData) => {
    const result = recurrenceSchema.safeParse(value);
    return result.success ? [] : result.error.issues.map((i) => i.message);
  };

  it("accepts an event that does not repeat and one that never ends", () => {
    expect(messages(noRecurrence())).toEqual([]);
    expect(
      messages(recurrence({ frequency: "DAILY", endType: "NEVER" })),
    ).toEqual([]);
  });

  it("asks for a weekday when it repeats weekly without one", () => {
    expect(messages(recurrence({ frequency: "WEEKLY" }))).toEqual([
      "Elige al menos un día de la semana",
    ]);
  });

  it("asks for the end date when it ends on a date", () => {
    expect(
      messages(recurrence({ frequency: "DAILY", endType: "UNTIL" })),
    ).toEqual(["Elige la fecha en la que termina"]);
  });

  it("limits the interval and the count", () => {
    expect(
      messages(recurrence({ frequency: "DAILY", interval: 0 })),
    ).toHaveLength(1);
    expect(
      messages(recurrence({ frequency: "DAILY", interval: 100 })),
    ).toHaveLength(1);
    expect(
      messages(
        recurrence({ frequency: "DAILY", endType: "COUNT", count: 1001 }),
      ),
    ).toHaveLength(1);
  });
});

describe("recurrencePreset", () => {
  it("is NONE for an event that does not repeat", () => {
    expect(recurrencePreset(noRecurrence(), FRIDAY)).toBe("NONE");
  });

  it("is DAILY for every day, forever", () => {
    expect(recurrencePreset(recurrence({ frequency: "DAILY" }), FRIDAY)).toBe(
      "DAILY",
    );
  });

  it("is WEEKLY for every week on the weekday of the event", () => {
    const weekly = recurrence({ frequency: "WEEKLY", daysOfWeek: [5] });
    expect(recurrencePreset(weekly, FRIDAY)).toBe("WEEKLY");
    expect(recurrencePreset(recurrence({ frequency: "WEEKLY" }), FRIDAY)).toBe(
      "WEEKLY",
    );
  });

  it("is CUSTOM when the weekdays differ from the date", () => {
    expect(
      recurrencePreset(
        recurrence({ frequency: "WEEKLY", daysOfWeek: [1] }),
        FRIDAY,
      ),
    ).toBe("CUSTOM");
    expect(
      recurrencePreset(
        recurrence({ frequency: "WEEKLY", daysOfWeek: [5, 1] }),
        FRIDAY,
      ),
    ).toBe("CUSTOM");
  });

  it("is CUSTOM with an interval, an end, or a monthly or yearly rule", () => {
    expect(
      recurrencePreset(recurrence({ frequency: "DAILY", interval: 2 }), FRIDAY),
    ).toBe("CUSTOM");
    expect(
      recurrencePreset(
        recurrence({ frequency: "DAILY", endType: "COUNT" }),
        FRIDAY,
      ),
    ).toBe("CUSTOM");
    expect(recurrencePreset(recurrence({ frequency: "MONTHLY" }), FRIDAY)).toBe(
      "CUSTOM",
    );
    expect(recurrencePreset(recurrence({ frequency: "YEARLY" }), FRIDAY)).toBe(
      "CUSTOM",
    );
  });
});
