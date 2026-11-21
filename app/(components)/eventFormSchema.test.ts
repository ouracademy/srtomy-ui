import { describe, expect, it } from "vitest";
import { eventFormSchema, type EventDetailFormData } from "./eventFormSchema";
import { noRecurrence } from "./recurrence";

const at = (hours: number) => new Date(2026, 10, 21, hours);

const values = (
  overrides: Partial<EventDetailFormData> = {},
): EventDetailFormData => ({
  name: "Culto",
  date: at(0),
  endDate: at(0),
  startTime: at(10),
  endTime: at(12),
  recurrence: noRecurrence(),
  type: 1,
  speakers: [],
  registration: { enabled: false, requiresAccount: false, tickets: [] },
  ...overrides,
});

describe("eventFormSchema", () => {
  it("accepts an event that ends after it starts", () => {
    expect(eventFormSchema.safeParse(values()).success).toBe(true);
  });

  it("rejects an event that ends before it starts, on endTime", () => {
    const result = eventFormSchema.safeParse(values({ endTime: at(9) }));

    expect(result.success).toBe(false);
    expect(result.error?.issues).toContainEqual(
      expect.objectContaining({
        path: ["endTime"],
        message: "El evento debe terminar después de empezar",
      }),
    );
  });

  it("asks for a title", () => {
    const result = eventFormSchema.safeParse(values({ name: "  " }));

    expect(result.error?.issues[0]?.message).toBe(
      "Por favor ingrese el título",
    );
  });
});
