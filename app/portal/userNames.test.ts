import { describe, expect, it } from "vitest";
import { suggestedNames } from "./userNames";

describe("suggestedNames", () => {
  it("uses the given and family names when the provider sends them", () => {
    expect(
      suggestedNames({
        given_name: " Ana ",
        family_name: "Díaz Rojas",
        name: "Otro Nombre",
      }),
    ).toEqual({ firstName: "Ana", lastName: "Díaz Rojas" });
  });

  it("keeps a lone given name", () => {
    expect(suggestedNames({ given_name: "Ana" })).toEqual({
      firstName: "Ana",
      lastName: "",
    });
  });

  it("splits the full name at the first space", () => {
    expect(suggestedNames({ name: "Ana María Díaz" })).toEqual({
      firstName: "Ana",
      lastName: "María Díaz",
    });
    expect(suggestedNames({ name: "Ana" })).toEqual({
      firstName: "Ana",
      lastName: "",
    });
  });

  it("proposes nothing when the name is an email, blank or missing", () => {
    const none = { firstName: "", lastName: "" };
    expect(suggestedNames({ name: "ana@example.com" })).toEqual(none);
    expect(suggestedNames({ name: "  " })).toEqual(none);
    expect(suggestedNames({})).toEqual(none);
    expect(suggestedNames(undefined)).toEqual(none);
  });
});
