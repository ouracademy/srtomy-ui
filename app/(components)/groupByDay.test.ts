import { describe, expect, it } from "vitest";
import { groupByDay } from "./groupByDay";

const item = (id: string, start?: Date) => ({ id, start });

describe("groupByDay", () => {
  it("groups the items by the day they start, in order", () => {
    const days = groupByDay([
      item("c", new Date(2026, 9, 24, 15, 0)),
      item("a", new Date(2026, 9, 23, 18, 0)),
      item("b", new Date(2026, 9, 23, 9, 0)),
    ]);

    expect(days.map((day) => day.day)).toEqual([
      new Date(2026, 9, 23),
      new Date(2026, 9, 24),
    ]);
    expect(days[0]?.items.map((i) => i.id)).toEqual(["b", "a"]);
    expect(days[1]?.items.map((i) => i.id)).toEqual(["c"]);
  });

  it("leaves out what has no start and is empty without items", () => {
    expect(groupByDay([])).toEqual([]);
    expect(groupByDay([item("x")])).toEqual([]);
  });
});
