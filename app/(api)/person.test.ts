import { describe, expect, it } from "vitest";
import { PersonResponseSchema } from "./person";

const response = {
  id: "p1",
  firstName: "Ana",
  lastName: "Ruiz",
  phoneNumber: "+51999",
  age: null,
  birthdate: null,
};

describe("PersonResponseSchema email", () => {
  it("keeps the email of the person", () => {
    expect(
      PersonResponseSchema.parse({ ...response, email: "ana@x.org" }).email,
    ).toBe("ana@x.org");
  });

  it("is an empty string when the person has none", () => {
    expect(PersonResponseSchema.parse({ ...response, email: null }).email).toBe(
      "",
    );
    expect(PersonResponseSchema.parse(response).email).toBe("");
  });
});
