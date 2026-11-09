import { afterEach, describe, expect, it, vi } from "vitest";
import type { MyEventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import {
  eventKey,
  readSeenEvents,
  registeredEvents,
  saveSeenEvents,
} from "./seenEvents";

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

const event = (overrides: Partial<MyEventResponse>): MyEventResponse => ({
  title: "Retiro",
  slug: "retiro",
  registered: true,
  registrationStatus: "CONFIRMED",
  ...overrides,
});

describe("registeredEvents", () => {
  it("keeps the places held and drops cancelled ones and plain attendance", () => {
    const held = event({ slug: "a" });
    const cancelled = event({ slug: "b", registrationStatus: "CANCELLED" });
    const attendedOnly = event({
      slug: "c",
      registered: false,
      attended: true,
    });

    expect(registeredEvents([held, cancelled, attendedOnly])).toEqual([held]);
    expect(registeredEvents(undefined)).toEqual([]);
  });
});

describe("eventKey", () => {
  it("prefers the registration so signing up again counts as new", () => {
    expect(eventKey(event({ registrationId: "r1" }))).toBe("r1");
    expect(eventKey(event({}))).toBe("retiro");
  });
});

describe("seen events storage", () => {
  it("round-trips the saved keys", () => {
    saveSeenEvents(new Set(["r1", "r2"]));

    expect(readSeenEvents()).toEqual(new Set(["r1", "r2"]));
  });

  it("starts empty when nothing is stored or the value is corrupt", () => {
    expect(readSeenEvents().size).toBe(0);
    window.localStorage.setItem("ovejafiel.seenEvents", "{no json");
    expect(readSeenEvents().size).toBe(0);
  });

  it("does not fail when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(readSeenEvents().size).toBe(0);
    expect(() => saveSeenEvents(new Set(["r1"]))).not.toThrow();
  });
});
