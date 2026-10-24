import { describe, expect, it } from "vitest";
import { buildDirectoryTree, flattenTree } from "./directoryTree";

const nodes = [
  { id: "c", name: "Iglesia", type: "CHURCH" as const },
  { id: "s2", name: "Sede Sur", type: "LOCATION" as const, parentId: "c" },
  { id: "s1", name: "Sede Norte", type: "LOCATION" as const, parentId: "c" },
  { id: "g", name: "Jóvenes", type: "GROUP" as const, parentId: "s1" },
  { id: "sub", name: "Alabanza", type: "MINISTRY" as const, parentId: "g" },
];

describe("buildDirectoryTree", () => {
  it("nests the nodes under their parents, sorted by name, with their depth", () => {
    const [church] = buildDirectoryTree(nodes);

    expect(church?.depth).toBe(0);
    expect(church?.children.map((c) => c.name)).toEqual([
      "Sede Norte",
      "Sede Sur",
    ]);
    expect(church?.children[0]?.children[0]?.children[0]).toMatchObject({
      name: "Alabanza",
      depth: 3,
    });
  });

  it("treats a node whose parent is missing as a root", () => {
    const roots = buildDirectoryTree([
      { id: "g", name: "Jóvenes", parentId: "unknown" },
    ]);

    expect(roots.map((r) => r.id)).toEqual(["g"]);
  });

  it("ignores entries without an id", () => {
    expect(buildDirectoryTree([{ name: "Sin id" }])).toEqual([]);
  });
});

describe("flattenTree", () => {
  it("lists parents before their children, in reading order", () => {
    expect(flattenTree(buildDirectoryTree(nodes)).map((n) => n.name)).toEqual([
      "Iglesia",
      "Sede Norte",
      "Jóvenes",
      "Alabanza",
      "Sede Sur",
    ]);
  });
});
