import { describe, expect, it } from "vitest";
import { fullName } from "./fullName";

describe("fullName", () => {
  it("joins the first and last name", () => {
    expect(fullName({ firstName: "Ana", lastName: "Diaz" })).toBe("Ana Diaz");
  });
});
