import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { moveSubEvent, toMoveRequest } from "./moveSubEvent";

const api = vi.hoisted(() => ({ get: vi.fn(), put: vi.fn() }));
vi.mock("@/app/(api)/generated", () => ({
  getEventsById: (...args: unknown[]) => api.get(...args),
  putEventsById: (...args: unknown[]) => api.put(...args),
}));

const event: EventResponse = {
  id: "c1",
  title: "Taller",
  address: "Salón 2",
  description: "Para todos",
  isACourse: true,
  registrationMode: "OWN",
  organization: { id: "org-1", name: "Sede" },
  speakers: [{ id: "s1" }],
};

beforeEach(() => {
  api.get.mockReset();
  api.put.mockReset();
});

describe("toMoveRequest", () => {
  it("changes only when the sub-event happens", () => {
    const request = toMoveRequest(
      event,
      new Date("2026-10-24T14:00:00Z"),
      new Date("2026-10-24T16:00:00Z"),
      "America/Lima",
    );

    expect(request).toMatchObject({
      name: "Taller",
      address: "Salón 2",
      description: "Para todos",
      organizationId: "org-1",
      isACourse: true,
      speakerIds: ["s1"],
      registrationMode: "OWN",
      option: "THIS_EVENT",
      timeZone: "America/Lima",
    });
    expect(request.recurrence).toBeUndefined();
    expect(request.startTime).toMatch(/^2026-10-24T\d\d:00:00[+-Z]/);
  });
});

describe("moveSubEvent", () => {
  it("reads the sub-event and saves it moved", async () => {
    api.get.mockResolvedValue(event);
    api.put.mockResolvedValue({ id: "c1" });

    const result = await moveSubEvent(
      "c1",
      new Date("2026-10-24T14:00:00Z"),
      new Date("2026-10-24T16:00:00Z"),
    );

    expect(api.get).toHaveBeenCalledWith("c1");
    expect(api.put).toHaveBeenCalledWith(
      "c1",
      expect.objectContaining({ name: "Taller", option: "THIS_EVENT" }),
    );
    expect(result).toEqual({ id: "c1" });
  });
});
