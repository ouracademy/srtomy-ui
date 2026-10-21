import { describe, expect, it } from "vitest";
import { handleDates } from "./date";

describe("handleDates", () => {
  it("parses local ISO date-times into Date objects", () => {
    const body = { startsAt: "2025-03-15T10:30:00" };

    handleDates(body);

    expect(body.startsAt).toBeInstanceOf(Date);
    expect((body.startsAt as unknown as Date).getFullYear()).toBe(2025);
    expect((body.startsAt as unknown as Date).getHours()).toBe(10);
  });

  it("parses zoned ISO date-times into the right instant", () => {
    const body = { createdAt: "2025-03-15T10:30:00Z" };

    handleDates(body);

    expect((body.createdAt as unknown as Date).toISOString()).toBe(
      "2025-03-15T10:30:00.000Z",
    );
  });

  it("converts dates nested in objects and arrays", () => {
    const body = {
      event: { date: "2025-01-02T03:04:05" },
      items: [{ date: "2025-01-02T03:04:05" }],
    };

    handleDates(body);

    expect(body.event.date).toBeInstanceOf(Date);
    expect(body.items[0]?.date).toBeInstanceOf(Date);
  });

  it("leaves other values untouched", () => {
    const body = {
      name: "Ana",
      birthdate: "2000-05-01",
      age: 25,
      active: true,
      nothing: null,
    };

    handleDates(body);

    expect(body).toEqual({
      name: "Ana",
      birthdate: "2000-05-01",
      age: 25,
      active: true,
      nothing: null,
    });
  });

  it("ignores null, undefined and primitive bodies", () => {
    expect(() => {
      handleDates(null);
      handleDates(undefined);
      handleDates("2025-01-02T03:04:05");
    }).not.toThrow();
  });
});
