import type { AxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_AUTH0_DOMAIN", "tenant.example.com");
vi.stubEnv("NEXT_PUBLIC_AUTH0_CLIENT_ID", "client");
vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test");

const { apiClient } = await import("../client");
const { createPerson, updatePerson } = await import("./people");
const { createEvent, deleteEvent, fetchEvents, saveAttendance } =
  await import("./events");
const { createGroup, createLocation, deleteOrganization, updateLocation } =
  await import("./organizations");
const { sendComplaint } = await import("./complaints");

let requests: AxiosRequestConfig[] = [];

beforeEach(() => {
  requests = [];
  apiClient.defaults.adapter = async (config) => {
    requests.push(config);
    return { data: [], status: 200, statusText: "OK", headers: {}, config };
  };
});

const last = () => requests[requests.length - 1];
const body = () => JSON.parse(String(last()?.data));

describe("people service", () => {
  const payload = {
    firstName: "Ana",
    lastName: "Pérez",
    birthdate: null,
    hasBeenBaptized: true,
    organizationId: 12,
    roles: [1, 2],
  };

  it("creates a person", async () => {
    await createPerson(payload);

    expect([last()?.method, last()?.url]).toEqual(["post", "/people"]);
    expect(body()).toEqual(payload);
  });

  it("updates a person", async () => {
    await updatePerson(7, payload);

    expect([last()?.method, last()?.url]).toEqual(["put", "/people/7"]);
  });
});

describe("events service", () => {
  it("fetches the events of a date range", async () => {
    const start = new Date(2025, 0, 1);
    const end = new Date(2025, 0, 8);

    await fetchEvents({ organizationId: 12, start, end });

    expect(last()?.url).toBe("/events");
    expect(last()?.params).toEqual({ organizationId: 12, start, end });
  });

  it("creates an event", async () => {
    await createEvent({
      name: "Culto",
      organizationId: 12,
      startTime: "2025-01-01T10:00:00-05:00",
      endTime: "2025-01-01T12:00:00-05:00",
      speakerIds: [],
      daysOfWeek: [],
      isACourse: false,
    });

    expect([last()?.method, last()?.url]).toEqual(["post", "/events"]);
  });

  it("sends the delete option in the request body", async () => {
    await deleteEvent(3, "ALL_EVENTS");

    expect([last()?.method, last()?.url]).toEqual(["delete", "/events/3"]);
    expect(body()).toEqual({ option: "ALL_EVENTS" });
  });

  it("saves the attendance as a list of person ids", async () => {
    await saveAttendance(3, [1, 2]);

    expect(last()?.url).toBe("/events/3/attendance");
    expect(body()).toEqual({ personIds: [1, 2] });
  });
});

describe("organizations service", () => {
  const location = {
    name: "Sede",
    address: "Calle 1",
    phoneNumber: "+51999",
    roles: [],
  };

  it("creates and updates locations", async () => {
    await createLocation({ ...location, parentId: 1 });
    expect([last()?.method, last()?.url]).toEqual([
      "post",
      "/organizations/locations",
    ]);

    await updateLocation(5, location);
    expect([last()?.method, last()?.url]).toEqual([
      "put",
      "/organizations/locations/5",
    ]);
  });

  it("creates a group and deletes an organization", async () => {
    await createGroup({
      name: "Jóvenes",
      type: "GROUP",
      parentId: 12,
      leaderIds: [],
      memberIds: [],
    });
    expect(last()?.url).toBe("/organizations/locations/childs");

    await deleteOrganization(9);
    expect([last()?.method, last()?.url]).toEqual([
      "delete",
      "/organizations/9",
    ]);
  });
});

describe("complaints service", () => {
  it("posts the complaint", async () => {
    await sendComplaint({
      firstName: "Ana",
      lastName: "Pérez",
      dni: "12345678",
      address: "Calle 1",
      email: "",
      comment: "hola",
    });

    expect([last()?.method, last()?.url]).toEqual(["post", "/complaints"]);
  });
});
