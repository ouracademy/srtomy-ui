import { describe, expect, it } from "vitest";
import {
  customRangeLabel,
  customSelection,
  presetToRange,
  previousEquivalentRange,
  selectionForPreset,
  toApiDate,
} from "./dateRange";

const NOW = new Date(2026, 9, 30); // Thu 30 Oct 2026

describe("presetToRange", () => {
  it("last-week: the 7 days ending today", () => {
    const { start, end } = presetToRange("last-week", NOW);
    expect(toApiDate(start)).toBe("2026-10-24");
    expect(toApiDate(end)).toBe("2026-10-30");
  });

  it("last-month: the month ending today", () => {
    const { start, end } = presetToRange("last-month", NOW);
    expect(toApiDate(start)).toBe("2026-09-30");
    expect(toApiDate(end)).toBe("2026-10-30");
  });

  it("last-quarter: the 3 months ending today", () => {
    const { start, end } = presetToRange("last-quarter", NOW);
    expect(toApiDate(start)).toBe("2026-07-30");
    expect(toApiDate(end)).toBe("2026-10-30");
  });

  it("last-year: the year ending today", () => {
    const { start, end } = presetToRange("last-year", NOW);
    expect(toApiDate(start)).toBe("2025-10-30");
    expect(toApiDate(end)).toBe("2026-10-30");
  });
});

describe("previousEquivalentRange", () => {
  it("returns the same-length period right before the range", () => {
    const { start, end } = previousEquivalentRange(
      new Date(2026, 9, 24),
      new Date(2026, 9, 30),
    );
    expect(toApiDate(start)).toBe("2026-10-17");
    expect(toApiDate(end)).toBe("2026-10-23");
  });

  it("handles a single-day range", () => {
    const { start, end } = previousEquivalentRange(
      new Date(2026, 9, 30),
      new Date(2026, 9, 30),
    );
    expect(toApiDate(start)).toBe("2026-10-29");
    expect(toApiDate(end)).toBe("2026-10-29");
  });

  it("crosses a month boundary", () => {
    const { start, end } = previousEquivalentRange(
      new Date(2026, 9, 1),
      new Date(2026, 9, 7),
    );
    expect(toApiDate(start)).toBe("2026-09-24");
    expect(toApiDate(end)).toBe("2026-09-30");
  });
});

describe("customRangeLabel", () => {
  it("formats both boundaries in Spanish", () => {
    expect(customRangeLabel(new Date(2026, 9, 1), new Date(2026, 9, 20))).toBe(
      "1 oct 2026 – 20 oct 2026",
    );
  });
});

describe("selectionForPreset", () => {
  it("bundles the range, its label and the previous equivalent period", () => {
    const selection = selectionForPreset("last-week", NOW);
    expect(selection.preset).toBe("last-week");
    expect(selection.label).toBe("Última semana");
    expect(toApiDate(selection.start)).toBe("2026-10-24");
    expect(toApiDate(selection.end)).toBe("2026-10-30");
    expect(toApiDate(selection.previousStart)).toBe("2026-10-17");
    expect(toApiDate(selection.previousEnd)).toBe("2026-10-23");
  });
});

describe("customSelection", () => {
  it("bundles a custom range with its own label and previous period", () => {
    const selection = customSelection(
      new Date(2026, 9, 1),
      new Date(2026, 9, 20),
    );
    expect(selection.preset).toBe("custom");
    expect(selection.label).toBe("1 oct 2026 – 20 oct 2026");
    expect(toApiDate(selection.previousStart)).toBe("2026-09-11");
    expect(toApiDate(selection.previousEnd)).toBe("2026-09-30");
  });
});
