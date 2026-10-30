import { describe, expect, it } from "vitest";
import type { EventDetailFormData } from "@/app/(components)/EventForm";
import { describeChange, impactMessages, toEditRequest } from "./eventChange";
import { noRecurrence } from "@/app/(components)/recurrence";
import { noRegistration } from "@/app/(components)/registration";

const NODE = "11111111-1111-1111-1111-111111111111";

const initial: EventDetailFormData = {
  name: "Servicio",
  date: new Date(2026, 0, 12, 10, 0),
  endDate: new Date(2026, 0, 12, 10, 0),
  startTime: new Date(2026, 0, 12, 10, 0),
  endTime: new Date(2026, 0, 12, 12, 0),
  address: "Av. Lima 1",
  description: "Culto",
  recurrence: noRecurrence(),
  type: 0,
  speakers: [{ id: "s1", label: "Ana" }],
  registration: noRegistration(),
};

const weekly = {
  ...noRecurrence(),
  frequency: "WEEKLY" as const,
  daysOfWeek: [1],
};

describe("describeChange", () => {
  it("sees nothing when only the text changed", () => {
    expect(
      describeChange(initial, { ...initial, description: "Otra" }),
    ).toEqual({
      scheduleMoved: false,
      detailsChanged: false,
      dayMoved: false,
      ruleChanged: false,
    });
  });

  it("sees a new name, place or speakers as details the people signed up should know", () => {
    expect(
      describeChange(initial, { ...initial, name: "Culto" }).detailsChanged,
    ).toBe(true);
    expect(
      describeChange(initial, { ...initial, address: "Otra calle" })
        .detailsChanged,
    ).toBe(true);
    expect(
      describeChange(initial, {
        ...initial,
        speakers: [...initial.speakers, { id: "s2", label: "Luis" }],
      }).detailsChanged,
    ).toBe(true);
    expect(
      describeChange(initial, { ...initial, address: " Av. Lima 1 " })
        .detailsChanged,
    ).toBe(false);
  });

  it("sees a new start, end or day as a move of the schedule", () => {
    const later = new Date(2026, 0, 12, 11, 0);
    expect(
      describeChange(initial, { ...initial, startTime: later }).scheduleMoved,
    ).toBe(true);
    expect(
      describeChange(initial, { ...initial, endTime: later }).scheduleMoved,
    ).toBe(true);
    const moved = describeChange(initial, {
      ...initial,
      date: new Date(2026, 0, 13, 10, 0),
    });
    expect(moved).toMatchObject({ scheduleMoved: true, dayMoved: true });
  });

  it("ignores the seconds and the day inside the time pickers", () => {
    const sameHour = new Date(2026, 5, 1, 10, 0, 30);
    expect(
      describeChange(initial, { ...initial, startTime: sameHour }),
    ).toMatchObject({ scheduleMoved: false });
  });

  it("sees a different rule, and not the same rule with the days in another order", () => {
    const base = { ...initial, recurrence: { ...weekly, daysOfWeek: [1, 3] } };
    expect(
      describeChange(base, {
        ...base,
        recurrence: { ...weekly, daysOfWeek: [3, 1] },
      }).ruleChanged,
    ).toBe(false);
    expect(
      describeChange(base, {
        ...base,
        recurrence: { ...weekly, daysOfWeek: [1, 3], interval: 2 },
      }).ruleChanged,
    ).toBe(true);
  });
});

describe("impactMessages", () => {
  const none = {
    scheduleMoved: false,
    detailsChanged: false,
    dayMoved: false,
    ruleChanged: false,
  };

  it("says nothing for a text-only change", () => {
    expect(impactMessages(none, "THIS_EVENT", false)).toEqual([]);
  });

  it("warns that people signed up get an email when the schedule moves or the details change", () => {
    expect(
      impactMessages({ ...none, scheduleMoved: true }, "THIS_EVENT", false),
    ).toEqual([expect.stringContaining("recibirán un correo")]);
    expect(
      impactMessages({ ...none, detailsChanged: true }, "THIS_EVENT", false),
    ).toEqual([expect.stringContaining("el lugar o los ponentes")]);
  });

  it("warns that one occurrence leaves its series", () => {
    expect(impactMessages(none, "THIS_EVENT", true)).toEqual([
      expect.stringContaining("dejará de ser parte de la serie"),
    ]);
  });

  it("warns what is kept when the rule or the day of a series changes", () => {
    expect(
      impactMessages({ ...none, ruleChanged: true }, "ALL_EVENTS", true),
    ).toEqual([expect.stringContaining("inscritos o asistencia no cambian")]);
    expect(
      impactMessages(
        { ...none, dayMoved: true },
        "THIS_AND_THE_FOLLOWING_EVENTS",
        true,
      ),
    ).toHaveLength(1);
  });

  it("does not warn about the series for a single event", () => {
    expect(
      impactMessages({ ...none, ruleChanged: true }, "ALL_EVENTS", false),
    ).toEqual([]);
  });
});

describe("toEditRequest", () => {
  const context = {
    nodeId: NODE,
    initial,
    values: { ...initial, name: "Culto" },
    option: "THIS_EVENT" as const,
    repeats: false,
    timeZone: "America/Lima",
  };

  it("sends the data of the form with the day and the hours", () => {
    const request = toEditRequest({
      ...context,
      values: {
        ...context.values,
        // Moving the day moves the end with it, as the form does.
        date: new Date(2026, 0, 14, 0, 0),
        endDate: new Date(2026, 0, 14, 0, 0),
        type: 1,
      },
    });
    expect(request).toMatchObject({
      name: "Culto",
      address: "Av. Lima 1",
      description: "Culto",
      organizationId: NODE,
      isACourse: true,
      speakerIds: ["s1"],
      option: "THIS_EVENT",
    });
    expect(request.startTime).toMatch(/^2026-01-14T10:00:00[+-Z]/);
    expect(request.endTime).toMatch(/^2026-01-14T12:00:00[+-Z]/);
  });

  it("sends the zone of a single event, and no rule when it does not repeat", () => {
    const request = toEditRequest(context);
    expect(request.timeZone).toBe("America/Lima");
    expect(request.recurrence).toBeUndefined();
  });

  it("lets a single event start repeating", () => {
    const request = toEditRequest({
      ...context,
      values: { ...context.values, recurrence: weekly },
    });
    expect(request.recurrence).toMatchObject({ frequency: "WEEKLY" });
  });

  it("does not send the rule of a series the user did not change, nor the zone", () => {
    const series = { ...initial, recurrence: weekly };
    const request = toEditRequest({
      ...context,
      initial: series,
      values: { ...series, name: "Culto" },
      option: "ALL_EVENTS",
      repeats: true,
    });
    expect(request.recurrence).toBeUndefined();
    expect(request.timeZone).toBeUndefined();
  });

  it("sends the new rule of a series with the zone when it reaches more than this event", () => {
    const series = { ...initial, recurrence: weekly };
    const values = {
      ...series,
      recurrence: { ...weekly, frequency: "DAILY" as const },
    };
    const request = toEditRequest({
      ...context,
      initial: series,
      values,
      option: "ALL_EVENTS",
      repeats: true,
    });
    expect(request.recurrence).toMatchObject({ frequency: "DAILY" });
    expect(request.timeZone).toBe("America/Lima");
  });

  it("never sends the rule when only this event of a series is edited", () => {
    const series = { ...initial, recurrence: weekly };
    const request = toEditRequest({
      ...context,
      initial: series,
      values: {
        ...series,
        recurrence: { ...weekly, frequency: "DAILY" as const },
      },
      option: "THIS_EVENT",
      repeats: true,
    });
    expect(request.recurrence).toBeUndefined();
    expect(request.timeZone).toBeUndefined();
  });
});

describe("an event of several days", () => {
  const several: EventDetailFormData = {
    ...initial,
    endDate: new Date(2026, 0, 14, 12, 0),
  };

  it("ends on the day it ends, not the day it starts", () => {
    const request = toEditRequest({
      nodeId: NODE,
      initial: several,
      values: several,
      option: "THIS_EVENT",
      repeats: false,
      timeZone: "America/Lima",
    });

    expect(request.startTime).toMatch(/^2026-01-12T10:00:00/);
    expect(request.endTime).toMatch(/^2026-01-14T12:00:00/);
  });

  it("counts a new last day as a change of the schedule", () => {
    const change = describeChange(initial, several);

    expect(change.scheduleMoved).toBe(true);
    expect(change.dayMoved).toBe(false);
  });
});
