import { describe, expect, it, vi } from "vitest";
import { browserTimeZone, screenContextFrom } from "./screenContext";

describe("screenContextFrom", () => {
  it("reads the node of any screen inside it", () => {
    expect(screenContextFrom("/portal/node-1")).toEqual({ nodeId: "node-1" });
    expect(screenContextFrom("/portal/node-1/positions")).toEqual({
      nodeId: "node-1",
    });
  });

  it("reads the event of its detail", () => {
    expect(
      screenContextFrom("/portal/node-1/event/ev-9/attendance", "America/Lima"),
    ).toEqual({ nodeId: "node-1", eventId: "ev-9", timeZone: "America/Lima" });
  });

  it("reads the person of their profile", () => {
    expect(screenContextFrom("/portal/node-1/person/p-3")).toEqual({
      nodeId: "node-1",
      personId: "p-3",
    });
  });

  it("does not take a form for an id", () => {
    expect(screenContextFrom("/portal/node-1/person/create")).toEqual({
      nodeId: "node-1",
    });
    expect(screenContextFrom("/portal/node-1/location/new")).toEqual({
      nodeId: "node-1",
    });
  });

  it("has no context outside a node", () => {
    expect(screenContextFrom("/portal")).toBeUndefined();
    expect(screenContextFrom("/portal/me")).toBeUndefined();
    expect(screenContextFrom("/portal/profile")).toBeUndefined();
    expect(screenContextFrom("/e/abc")).toBeUndefined();
  });

  it("leaves out an unknown time zone", () => {
    expect(screenContextFrom("/portal/node-1", undefined)).not.toHaveProperty(
      "timeZone",
    );
  });
});

describe("browserTimeZone", () => {
  it("returns the zone the browser resolves", () => {
    expect(browserTimeZone()).toBe(
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );
  });

  it("is undefined when the browser cannot tell", () => {
    const spy = vi.spyOn(Intl, "DateTimeFormat").mockImplementation(() => {
      throw new RangeError("no Intl");
    });

    expect(browserTimeZone()).toBeUndefined();
    spy.mockRestore();
  });
});
