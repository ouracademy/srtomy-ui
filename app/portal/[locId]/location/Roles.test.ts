import { describe, expect, it } from "vitest";
import { getFixedOptions, toSpanish } from "./Roles";
import type { AccountabilityTypeDto } from "@/app/(api)/generated/aPISrTommy.schemas";

const role = (name: string, isPredefined: boolean): AccountabilityTypeDto =>
  ({
    id: "11111111-1111-1111-1111-111111111111",
    name,
    isPredefined,
  }) as AccountabilityTypeDto;

describe("toSpanish", () => {
  it.each([
    ["PASTOR", "Pastor"],
    ["WORSHIP_LEADER", "Líder de alabanza"],
    ["USHER", "Ujier"],
  ])("translates %s", (name, expected) => {
    expect(toSpanish(name)).toBe(expected);
  });
});

describe("getFixedOptions", () => {
  it("returns only predefined roles, translated", () => {
    const roles = [
      role("PASTOR", true),
      role("Líder de jóvenes", false),
      role("WORSHIP_LEADER", true),
    ];

    expect(getFixedOptions(roles)).toEqual(["Pastor", "Líder de alabanza"]);
  });
});
