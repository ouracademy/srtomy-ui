import { describe, expect, it } from "vitest";
import { toLocationPayload } from "./LocationPayload";

const fixedOptions = ["Pastor", "Ujier"];

const values = {
  name: "Sede Norte",
  address: "Av. Uno 123",
  phoneNumber: "987654321",
  roles: ["Pastor", "Ujier", "Líder de jóvenes"],
};

describe("toLocationPayload", () => {
  it("sends the edited fields and keeps the description", () => {
    expect(
      toLocationPayload(values, { description: "Principal", fixedOptions }),
    ).toEqual({
      name: "Sede Norte",
      description: "Principal",
      address: "Av. Uno 123",
      phoneNumber: "987654321",
      roles: ["Líder de jóvenes"],
    });
  });

  it("sends an empty description when the location has none", () => {
    expect(toLocationPayload(values, { fixedOptions }).description).toBe("");
  });

  it("sends no custom roles when only fixed roles are selected", () => {
    const onlyFixed = { ...values, roles: ["Pastor"] };

    expect(
      toLocationPayload(onlyFixed, { description: "", fixedOptions }).roles,
    ).toEqual([]);
  });
});
