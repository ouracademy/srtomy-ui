import { describe, expect, it } from "vitest";
import { filterByName } from "./filterByName";

const items = [{ name: "Niños" }, { name: "Jóvenes" }, {}];

describe("filterByName", () => {
  it("returns everything for a blank search", () => {
    expect(filterByName(items, "  ")).toEqual(items);
  });

  it("ignores case and accents", () => {
    expect(filterByName(items, "NINOS")).toEqual([{ name: "Niños" }]);
    expect(filterByName(items, "jove")).toEqual([{ name: "Jóvenes" }]);
  });

  it("returns nothing when no name matches", () => {
    expect(filterByName(items, "zzz")).toEqual([]);
  });
});
