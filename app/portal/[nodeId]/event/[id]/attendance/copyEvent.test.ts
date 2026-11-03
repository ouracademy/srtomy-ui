import { describe, expect, it } from "vitest";
import { copyName, toCopyRequest } from "./copyEvent";

describe("copyName", () => {
  it("marks the name as a copy", () => {
    expect(copyName("Avivamiento 2030")).toBe("Avivamiento 2030 (copia)");
  });
});

describe("toCopyRequest", () => {
  it("starts the copy on the chosen day at the time of day of the original", () => {
    const original = new Date(2030, 0, 5, 9, 30);

    const request = toCopyRequest(original, "2031-01-04", "Avivamiento 2031");

    expect(new Date(request.startTime)).toEqual(new Date(2031, 0, 4, 9, 30));
    expect(request.name).toBe("Avivamiento 2031");
  });

  it("sends no name when it is left blank, so the original name is kept", () => {
    const request = toCopyRequest(
      new Date(2030, 0, 5, 9, 0),
      "2031-01-04",
      "  ",
    );

    expect(request.name).toBeUndefined();
  });
});
