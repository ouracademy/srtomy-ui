import { describe, expect, it } from "vitest";
import reorder, { moveBetween, reorderMap } from "./reorder";
import type { PersonMap } from "./types";

const author = (id: string) => ({ id, name: `Person ${id}` });

const personMap = (): PersonMap => ({
  VISITOR: [author("1"), author("2"), author("3")],
  MEMBERSHIP_IN_PROGRESS: [author("4")],
  MEMBER: [],
});

const location = (droppableId: string, index: number) => ({
  droppableId,
  index,
});

describe("reorder", () => {
  it("moves an item and does not mutate the input", () => {
    const list = ["a", "b", "c"];

    expect(reorder(list, 0, 2)).toEqual(["b", "c", "a"]);
    expect(list).toEqual(["a", "b", "c"]);
  });
});

describe("reorderMap", () => {
  it("reorders inside the same column", () => {
    const { personMap: result } = reorderMap({
      personMap: personMap(),
      source: location("VISITOR", 0),
      destination: location("VISITOR", 2),
    });

    expect(result.VISITOR?.map((x) => x.id)).toEqual(["2", "3", "1"]);
  });

  it("moves a person to another column", () => {
    const original = personMap();

    const { personMap: result } = reorderMap({
      personMap: original,
      source: location("VISITOR", 1),
      destination: location("MEMBER", 0),
    });

    expect(result.VISITOR?.map((x) => x.id)).toEqual(["1", "3"]);
    expect(result.MEMBER?.map((x) => x.id)).toEqual(["2"]);
    expect(original.VISITOR).toHaveLength(3);
  });
});

describe("moveBetween", () => {
  const list1 = { id: "a", values: [1, 2, 3] };
  const list2 = { id: "b", values: [9] };

  it("moves from the first list to the second", () => {
    const result = moveBetween({
      list1,
      list2,
      source: location("a", 0),
      destination: location("b", 1),
    });

    expect(result.list1.values).toEqual([2, 3]);
    expect(result.list2.values).toEqual([9, 1]);
  });

  it("moves from the second list to the first", () => {
    const result = moveBetween({
      list1,
      list2,
      source: location("b", 0),
      destination: location("a", 0),
    });

    expect(result.list1.values).toEqual([9, 1, 2, 3]);
    expect(result.list2.values).toEqual([]);
    expect(list2.values).toEqual([9]);
  });
});
