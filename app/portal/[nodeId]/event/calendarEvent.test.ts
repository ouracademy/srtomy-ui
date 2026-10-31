import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { describe, expect, it } from "vitest";
import { isMegaEvent, toCalendarEvent } from "./calendarEvent";

const event = (overrides: Partial<EventResponse> = {}): EventResponse => ({
  id: "e1",
  title: "Culto",
  start: new Date(2026, 9, 23, 18, 0),
  end: new Date(2026, 9, 23, 20, 0),
  organization: { id: "n1", name: "Sede" },
  ...overrides,
});

describe("isMegaEvent", () => {
  it("is true only when the event lasts more than a day", () => {
    const start = new Date(2026, 9, 23, 9, 0);

    expect(isMegaEvent({ start, end: new Date(2026, 9, 25, 13, 0) })).toBe(
      true,
    );
    expect(isMegaEvent({ start, end: new Date(2026, 9, 23, 20, 0) })).toBe(
      false,
    );
  });

  it("keeps the hours of an overnight event", () => {
    expect(
      isMegaEvent({
        start: new Date(2026, 9, 23, 22, 0),
        end: new Date(2026, 9, 24, 6, 0),
      }),
    ).toBe(false);
  });
});

describe("toCalendarEvent", () => {
  it("draws a multi-day event as a band that includes its last day", () => {
    const calendarEvent = toCalendarEvent(
      event({
        start: new Date(2026, 9, 23, 9, 0),
        end: new Date(2026, 9, 25, 13, 0),
      }),
      "n1",
    );

    expect(calendarEvent.allDay).toBe(true);
    expect(calendarEvent.end).toEqual(new Date(2026, 9, 26, 0, 0));
    expect(calendarEvent.classNames).toContain("fc-mega-event");
  });

  it("names the event a sub-event belongs to", () => {
    const calendarEvent = toCalendarEvent(
      event({ title: "Taller", parentEventId: "p1", parentTitle: "Mega" }),
      "n1",
    );

    expect(calendarEvent.title).toBe("Taller · Mega");
    expect(calendarEvent.classNames).toContain("fc-sub-event");
    expect(calendarEvent.allDay).toBeUndefined();
  });

  it("names the node of an event of another node, after its parent", () => {
    const calendarEvent = toCalendarEvent(
      event({
        title: "Taller",
        parentTitle: "Mega",
        parentEventId: "p1",
        organization: { id: "n2", name: "Jóvenes" },
      }),
      "n1",
    );

    expect(calendarEvent.title).toBe("Taller · Mega · Jóvenes");
  });

  it("paints courses green and leaves the rest to the calendar", () => {
    expect(
      toCalendarEvent(event({ isACourse: true }), "n1").backgroundColor,
    ).toBe("green");
    expect(toCalendarEvent(event(), "n1").backgroundColor).toBeUndefined();
  });
});
