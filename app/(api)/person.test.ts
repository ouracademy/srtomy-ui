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

describe("PersonResponseSchema optional fields", () => {
  it("accepts the person who created the church, with null phone and baptism", () => {
    const owner = PersonResponseSchema.parse({
      ...response,
      phoneNumber: null,
      hasBeenBaptized: null,
    });

    expect(owner.phoneNumber).toBe("");
    expect(owner.hasBeenBaptized).toBeUndefined();
  });

  it("keeps the phone and baptism when they are known", () => {
    const person = PersonResponseSchema.parse({
      ...response,
      hasBeenBaptized: true,
    });

    expect(person.phoneNumber).toBe("+51999");
    expect(person.hasBeenBaptized).toBe(true);
  });
});

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
