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

const organizationId = "11111111-1111-1111-1111-111111111111";
const personId = "22222222-2222-2222-2222-222222222222";
const eventId = "33333333-3333-3333-3333-333333333333";
const parentId = "44444444-4444-4444-4444-444444444444";
const locationId = "55555555-5555-5555-5555-555555555555";
const organizationToDeleteId = "66666666-6666-6666-6666-666666666666";
const roleIds = [
  "77777777-7777-7777-7777-777777777777",
  "88888888-8888-8888-8888-888888888888",
];

describe("people service", () => {
  const payload = {
    firstName: "Ana",
    lastName: "Pérez",
    birthdate: null,
    hasBeenBaptized: true,
    organizationId,
    roles: roleIds,
  };

  it("creates a person", async () => {
    await createPerson(payload);

    expect([last()?.method, last()?.url]).toEqual(["post", "/people"]);
    expect(body()).toEqual(payload);
  });

  it("updates a person", async () => {
    await updatePerson(personId, payload);

    expect([last()?.method, last()?.url]).toEqual([
      "put",
      `/people/${personId}`,
    ]);
  });
});

describe("events service", () => {
  it("fetches the events of a date range", async () => {
    const start = new Date(2025, 0, 1);
    const end = new Date(2025, 0, 8);

    await fetchEvents({ organizationId, start, end });

    expect(last()?.url).toBe("/events");
    expect(last()?.params).toEqual({ organizationId, start, end });
  });

  it("creates an event", async () => {
    await createEvent({
      name: "Culto",
      organizationId,
      startTime: "2025-01-01T10:00:00-05:00",
      endTime: "2025-01-01T12:00:00-05:00",
      speakerIds: [],
      daysOfWeek: [],
      isACourse: false,
    });

    expect([last()?.method, last()?.url]).toEqual(["post", "/events"]);
  });

  it("sends the delete option in the request body", async () => {
    await deleteEvent(eventId, "ALL_EVENTS");

    expect([last()?.method, last()?.url]).toEqual([
      "delete",
      `/events/${eventId}`,
    ]);
    expect(body()).toEqual({ option: "ALL_EVENTS" });
  });

  it("saves the attendance as a list of person ids", async () => {
    await saveAttendance(eventId, roleIds);

    expect(last()?.url).toBe(`/events/${eventId}/attendance`);
    expect(body()).toEqual({ personIds: roleIds });
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
    await createLocation({ ...location, parentId });
    expect([last()?.method, last()?.url]).toEqual([
      "post",
      "/organizations/locations",
    ]);

    await updateLocation(locationId, location);
    expect([last()?.method, last()?.url]).toEqual([
      "put",
      `/organizations/locations/${locationId}`,
    ]);
  });

  it("creates a group and deletes an organization", async () => {
    await createGroup({
      name: "Jóvenes",
      type: "GROUP",
      parentId: organizationId,
      leaderIds: [],
      memberIds: [],
    });
    expect(last()?.url).toBe("/organizations/locations/childs");

    await deleteOrganization(organizationToDeleteId);
    expect([last()?.method, last()?.url]).toEqual([
      "delete",
      `/organizations/${organizationToDeleteId}`,
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
