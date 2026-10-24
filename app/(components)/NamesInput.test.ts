import { describe, expect, it } from "vitest";
import { dedupe } from "./NamesInput";

describe("dedupe", () => {
  it("keeps the first spelling and drops blanks", () => {
    expect(dedupe(["Pastor", " pastor", "", "Ujier "])).toEqual([
      "Pastor",
      "Ujier",
    ]);
  });
});
