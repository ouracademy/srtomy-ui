import { describe, expect, it } from "vitest";
import {
  connectionLabels,
  linkMessage,
  minutesLeft,
  waMeUrl,
} from "./whatsappLink";

describe("linkMessage", () => {
  it("is the keyword followed by the code", () => {
    expect(linkMessage("AB12-CD34")).toBe("VINCULAR AB12-CD34");
  });
});

describe("waMeUrl", () => {
  it("opens the chat with the message written, using only the digits", () => {
    expect(waMeUrl("+51 999 888 777", "AB12-CD34")).toBe(
      "https://wa.me/51999888777?text=VINCULAR%20AB12-CD34",
    );
  });

  it("has no link while the number is not known", () => {
    expect(waMeUrl(undefined, "AB12-CD34")).toBeUndefined();
    expect(waMeUrl("", "AB12-CD34")).toBeUndefined();
    expect(waMeUrl("sin número", "AB12-CD34")).toBeUndefined();
  });
});

describe("minutesLeft", () => {
  const now = new Date("2026-11-01T10:00:00Z");

  it("rounds up to whole minutes", () => {
    expect(minutesLeft(new Date("2026-11-01T10:09:10Z"), now)).toBe(10);
    expect(minutesLeft(new Date("2026-11-01T10:00:30Z"), now)).toBe(1);
  });

  it("never goes below zero and is zero without a date", () => {
    expect(minutesLeft(new Date("2026-11-01T09:00:00Z"), now)).toBe(0);
    expect(minutesLeft(undefined, now)).toBe(0);
  });
});

describe("connectionLabels", () => {
  it("names every state the API can send", () => {
    expect(Object.keys(connectionLabels).sort()).toEqual([
      "CONNECTED",
      "DISCONNECTED",
      "NOT_CONNECTED",
      "PENDING",
    ]);
  });
});
