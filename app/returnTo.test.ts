import { describe, expect, it } from "vitest";
import { returnToFrom } from "./returnTo";

describe("returnToFrom", () => {
  it("follows a path of this site", () => {
    expect(returnToFrom({ returnTo: "/invitacion/abc" })).toBe(
      "/invitacion/abc",
    );
  });

  it("goes to the portal when nothing was asked", () => {
    expect(returnToFrom()).toBe("/portal");
    expect(returnToFrom({})).toBe("/portal");
    expect(returnToFrom({ returnTo: 5 })).toBe("/portal");
  });

  it.each([
    "https://evil.example/login",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
  ])("never leaves the site: %s", (returnTo) => {
    expect(returnToFrom({ returnTo })).toBe("/portal");
  });
});

describe("returnToFrom fallback", () => {
  it("uses the given fallback for an unsafe path", () => {
    expect(returnToFrom({ returnTo: "//evil.com" }, "/portal/n1/person")).toBe(
      "/portal/n1/person",
    );
  });
});
