import { describe, expect, it } from "vitest";
import { locationSchema } from "./LocationSchema";

const fixedOptions = ["Pastor", "Ujier"];

const valid = {
  name: "Sede Norte",
  address: "Av. Uno 123",
  phoneNumber: "+51",
  roles: ["Pastor", "Líder de jóvenes"],
};

const schema = locationSchema(fixedOptions);

describe("locationSchema", () => {
  it("accepts a location with at least one role of its own", () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it("rejects a location with only predefined roles", () => {
    const result = schema.safeParse({ ...valid, roles: ["Pastor", "Ujier"] });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Agregue al menos un rol propio de la sede",
    );
  });

  it("rejects a location with no roles at all", () => {
    expect(schema.safeParse({ ...valid, roles: [] }).success).toBe(false);
  });

  it("still requires a name", () => {
    expect(schema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });
});
