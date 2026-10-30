import { describe, expect, it } from "vitest";
import {
  chartBars,
  monthLabel,
  monthLongLabel,
  summarizeGrowth,
} from "./growth";

describe("monthLabel", () => {
  it("shortens the month in Spanish", () => {
    expect(monthLabel("2026-10")).toBe("oct 26");
    expect(monthLongLabel("2026-10")).toBe("octubre de 2026");
  });

  it("keeps what it cannot read", () => {
    expect(monthLabel("nope")).toBe("nope");
    expect(monthLabel(undefined)).toBe("");
    expect(monthLongLabel(undefined)).toBe("");
  });
});

describe("summarizeGrowth", () => {
  it("adds up the months", () => {
    const months = [
      { joined: 10, becameMember: 3, left: 2 },
      { joined: 8, becameMember: 4, left: 0 },
    ];
    expect(summarizeGrowth(months)).toBe(
      "En los últimos 2 meses se sumaron 18 personas, 7 pasaron a ser miembros y 2 salieron.",
    );
  });

  it("handles singulars", () => {
    expect(summarizeGrowth([{ joined: 1, becameMember: 1, left: 1 }])).toBe(
      "En el último mes se sumó 1 persona, 1 pasó a ser miembro y 1 salió.",
    );
  });

  it("does not mention people who did not leave", () => {
    expect(summarizeGrowth([{ joined: 2, becameMember: 0 }])).toBe(
      "En el último mes se sumaron 2 personas y 0 pasaron a ser miembros.",
    );
  });

  it("says when nothing happened", () => {
    expect(summarizeGrowth([{}, {}])).toBe(
      "En los últimos 2 meses no hubo cambios.",
    );
  });
});

describe("chartBars", () => {
  it("scales to the biggest month", () => {
    const bars = chartBars(
      [
        { month: "2026-09", peopleAtEnd: 5, membersAtEnd: 1 },
        { month: "2026-10", peopleAtEnd: 10, membersAtEnd: 5 },
      ],
      100,
    );
    expect(bars).toEqual([
      { month: "2026-09", total: 50, members: 10 },
      { month: "2026-10", total: 100, members: 50 },
    ]);
  });

  it("does not divide by zero when nobody is there", () => {
    expect(chartBars([{ month: "2026-10" }], 100)).toEqual([
      { month: "2026-10", total: 0, members: 0 },
    ]);
  });
});
