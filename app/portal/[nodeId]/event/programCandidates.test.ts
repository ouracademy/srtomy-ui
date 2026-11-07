import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { describe, expect, it } from "vitest";
import { programCandidates } from "./programCandidates";

const event = (overrides: Partial<EventResponse>): EventResponse => ({
  id: "e",
  title: "Evento",
  start: new Date(2026, 9, 23, 9, 0),
  end: new Date(2026, 9, 25, 22, 0),
  ...overrides,
});
const picked = {
  start: new Date(2026, 9, 24, 15, 0),
  end: new Date(2026, 9, 24, 16, 0),
};

describe("programCandidates", () => {
  it("offers a multi-day event or one with a program that covers the hours", () => {
    const congress = event({ id: "congreso", title: "Congreso" });
    const day = event({
      id: "jornada",
      title: "Jornada",
      start: new Date(2026, 9, 24, 8, 0),
      end: new Date(2026, 9, 24, 20, 0),
      programSize: 3,
    });

    expect(programCandidates([congress, day], picked)).toEqual([congress, day]);
  });

  it("leaves out ordinary events, sub-events, series and what does not cover the hours", () => {
    const events = [
      event({
        id: "culto",
        start: new Date(2026, 9, 24, 14, 0),
        end: new Date(2026, 9, 24, 18, 0),
      }),
      event({ id: "taller", parentEventId: "congreso" }),
      event({
        id: "serie",
        recurrence: { frequency: "DAILY", interval: 1, endType: "NEVER" },
      }),
      event({
        id: "otro",
        start: new Date(2026, 10, 1, 9, 0),
        end: new Date(2026, 10, 3, 9, 0),
      }),
    ];

    expect(programCandidates(events, picked)).toEqual([]);
  });
});
