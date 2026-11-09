import type { MyEventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";

// Remembers which sign-ups the user already saw in the notification bell. The
// API has no "seen" flag, so it lives in this browser. Storage may be
// unavailable (private mode, blocked site data); everything then shows as new.
const KEY = "ovejafiel.seenEvents";

// The events and courses where the user holds a place, which is what the bell
// lists.
export const registeredEvents = (events: MyEventResponse[] = []) =>
  events.filter(
    (event) => event.registered && event.registrationStatus !== "CANCELLED",
  );

// One id per sign-up, so signing up again to the same event counts as new.
export const eventKey = (event: MyEventResponse) =>
  event.registrationId ?? event.slug ?? event.title ?? "";

export const readSeenEvents = (): Set<string> => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    return new Set(Array.isArray(stored) ? stored.map(String) : []);
  } catch {
    return new Set();
  }
};

export const saveSeenEvents = (keys: Set<string>) => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify([...keys]));
  } catch {
    // Nothing to do: remembering what was seen is a convenience.
  }
};
