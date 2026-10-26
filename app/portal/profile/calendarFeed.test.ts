import { describe, expect, it } from "vitest";
import { calendarLinks } from "./calendarFeed";

describe("calendarLinks", () => {
  const path = "/v1/public/calendar/abc123.ics";

  it("builds the address of the feed from the API origin", () => {
    expect(calendarLinks("https://api.example.org", path).url).toBe(
      "https://api.example.org/v1/public/calendar/abc123.ics",
    );
  });

  it("ignores a trailing slash in the origin", () => {
    expect(calendarLinks("https://api.example.org/", path).url).toBe(
      "https://api.example.org/v1/public/calendar/abc123.ics",
    );
  });

  it("uses webcal for Apple Calendar", () => {
    expect(calendarLinks("https://api.example.org", path).webcal).toBe(
      "webcal://api.example.org/v1/public/calendar/abc123.ics",
    );
  });

  it("opens Google Calendar with the subscription", () => {
    expect(calendarLinks("https://api.example.org", path).google).toBe(
      "https://calendar.google.com/calendar/r?cid=webcal%3A%2F%2Fapi.example.org%2Fv1%2Fpublic%2Fcalendar%2Fabc123.ics",
    );
  });
});
