import { describe, expect, it } from "vitest";
import { accessLabel, dateRangeLabel, hoursLabel } from "./eventSummary";

describe("dateRangeLabel", () => {
  it("is one day when the event starts and ends the same day", () => {
    expect(
      dateRangeLabel(new Date(2026, 10, 13, 9), new Date(2026, 10, 13, 20)),
    ).toBe("vie 13 nov");
  });

  it("says from which day to which when it lasts several", () => {
    expect(
      dateRangeLabel(new Date(2026, 10, 13, 9), new Date(2026, 10, 15, 20)),
    ).toBe("vie 13 nov a dom 15 nov");
  });

  it("says there is no date when there is none", () => {
    expect(dateRangeLabel(undefined, undefined)).toBe("Sin fecha");
  });
});

describe("hoursLabel", () => {
  it("gives the hours of the event", () => {
    expect(
      hoursLabel(new Date(2026, 10, 13, 9), new Date(2026, 10, 13, 20)),
    ).toBe("09:00 a 20:00");
    expect(hoursLabel(undefined, undefined)).toBe("");
  });
});

describe("accessLabel", () => {
  it("names who can open the event, and nothing when it is not known", () => {
    expect(accessLabel("ANYONE_WITH_LINK")).toBe(
      "Público: cualquiera con el enlace",
    );
    expect(accessLabel("CHURCH")).toBe("Solo la iglesia: con el enlace");
    expect(accessLabel("RESTRICTED")).toBe("Privado: solo con acceso");
    expect(accessLabel(undefined)).toBeUndefined();
  });
});
