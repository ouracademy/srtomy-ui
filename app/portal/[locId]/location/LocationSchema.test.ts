import { describe, expect, it } from "vitest";
import { locationSchema } from "./LocationSchema";

const fixedOptions = ["Pastor", "Ujier"];

const valid = {
  name: "Sede Norte",
  address: "Av. Uno 123",
  phoneNumber: "+51",
  roles: ["Pastor", "Líder de jóvenes"],
};

const creating = locationSchema(fixedOptions, { requireOwnRole: true });
const editing = locationSchema(fixedOptions, { requireOwnRole: false });

describe("locationSchema when creating", () => {
  it("accepts a location with at least one role of its own", () => {
    expect(creating.safeParse(valid).success).toBe(true);
  });

  it("rejects a location with only predefined roles", () => {
    const result = creating.safeParse({
      ...valid,
      roles: ["Pastor", "Ujier"],
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Agregue al menos un rol propio de la sede",
    );
  });

  it("rejects a location with no roles at all", () => {
    expect(creating.safeParse({ ...valid, roles: [] }).success).toBe(false);
  });
});

describe("locationSchema when editing", () => {
  it("accepts a location whose only roles are predefined", () => {
    expect(
      editing.safeParse({ ...valid, roles: ["Pastor", "Ujier"] }).success,
    ).toBe(true);
  });

  it("still requires a name", () => {
    expect(editing.safeParse({ ...valid, name: "" }).success).toBe(false);
  });
});
