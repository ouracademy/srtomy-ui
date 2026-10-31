import type { ChildResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { describe, expect, it } from "vitest";
import { deleteMessage, groupByDay } from "./program";

const child = (id: string, start: Date): ChildResponse => ({
  id,
  title: id,
  start,
  end: new Date(start.getTime() + 3_600_000),
});

describe("groupByDay", () => {
  it("groups the sub-events by the day they start, in order", () => {
    const days = groupByDay([
      child("c", new Date(2026, 9, 24, 15, 0)),
      child("a", new Date(2026, 9, 23, 18, 0)),
      child("b", new Date(2026, 9, 23, 9, 0)),
    ]);

    expect(days.map((day) => day.day)).toEqual([
      new Date(2026, 9, 23),
      new Date(2026, 9, 24),
    ]);
    expect(days[0]?.items.map((item) => item.id)).toEqual(["b", "a"]);
    expect(days[1]?.items.map((item) => item.id)).toEqual(["c"]);
  });

  it("is empty without sub-events", () => {
    expect(groupByDay([])).toEqual([]);
  });
});

describe("deleteMessage", () => {
  it("only warns about the program when there is one", () => {
    expect(deleteMessage(0)).not.toContain("sub-evento");
    expect(deleteMessage(1)).toContain("También se eliminará su sub-evento");
    expect(deleteMessage(3)).toContain(
      "También se eliminará sus 3 sub-eventos",
    );
  });
});
