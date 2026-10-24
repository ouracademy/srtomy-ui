import { describe, expect, it } from "vitest";
import { originLabel, titleWithOrigin } from "./originLabel";

describe("originLabel", () => {
  it("is empty for the node being viewed", () => {
    expect(originLabel("n1", "Sede", "n1")).toBeUndefined();
  });

  it("is the name of a descendant node", () => {
    expect(originLabel("g1", "Jóvenes", "n1")).toBe("Jóvenes");
  });

  it("is empty when the name is unknown", () => {
    expect(originLabel("g1", undefined, "n1")).toBeUndefined();
  });
});

describe("titleWithOrigin", () => {
  it("appends the label only when there is one", () => {
    expect(titleWithOrigin("Culto", "Jóvenes")).toBe("Culto · Jóvenes");
    expect(titleWithOrigin("Culto", undefined)).toBe("Culto");
  });
});
