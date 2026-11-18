import { describe, expect, it } from "vitest";
import { isCurrentUser } from "./isCurrentUser";

describe("isCurrentUser", () => {
  it("matches the name of the signed-in user, ignoring case and accents", () => {
    expect(
      isCurrentUser(
        { fullName: "André Mauricio" },
        { name: "andre  mauricio" },
      ),
    ).toBe(true);
  });

  it("matches first and last name when the name is something else", () => {
    expect(
      isCurrentUser(
        { fullName: "Ana Diaz" },
        { name: "ana@mail.com", given_name: "Ana", family_name: "Diaz" },
      ),
    ).toBe(true);
  });

  it("does not match another person", () => {
    expect(
      isCurrentUser({ fullName: "Nijay Gupta" }, { name: "André Mauricio" }),
    ).toBe(false);
  });

  it("does not match without a user or without a name", () => {
    expect(isCurrentUser({ fullName: "Ana" }, undefined)).toBe(false);
    expect(isCurrentUser({}, { name: "" })).toBe(false);
  });
});
