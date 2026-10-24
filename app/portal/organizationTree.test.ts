import { describe, expect, it } from "vitest";
import {
  buildForest,
  churchOf,
  flatten,
  pathTo,
  pickLandingNode,
  withIds,
  type OrganizationNode,
} from "./organizationTree";

const church: OrganizationNode = {
  id: "c",
  name: "Iglesia",
  type: "CHURCH",
  accessible: true,
};
const north: OrganizationNode = {
  id: "n",
  name: "Sede Norte",
  type: "LOCATION",
  parentId: "c",
  accessible: true,
};
const center: OrganizationNode = {
  id: "s",
  name: "Sede Centro",
  type: "LOCATION",
  parentId: "c",
  accessible: true,
};
const youth: OrganizationNode = {
  id: "y",
  name: "Jóvenes",
  type: "MINISTRY",
  parentId: "s",
  accessible: true,
};
const cell: OrganizationNode = {
  id: "g",
  name: "Célula",
  type: "GROUP",
  parentId: "y",
  accessible: true,
};
const nodes = [cell, north, church, youth, center];

describe("pathTo", () => {
  it("walks from the church down to the node", () => {
    expect(pathTo(nodes, "g").map((node) => node.id)).toEqual([
      "c",
      "s",
      "y",
      "g",
    ]);
  });

  it("is empty for an unknown node", () => {
    expect(pathTo(nodes, "nope")).toEqual([]);
  });

  it("stops on a cycle instead of looping forever", () => {
    const a: OrganizationNode = { id: "a", parentId: "b" };
    const b: OrganizationNode = { id: "b", parentId: "a" };
    expect(pathTo([a, b], "a").map((node) => node.id)).toEqual(["b", "a"]);
  });
});

describe("churchOf", () => {
  it("is the root of the path", () => {
    expect(churchOf(nodes, "y")?.id).toBe("c");
  });
});

describe("buildForest", () => {
  it("nests children by name with their depth", () => {
    const forest = buildForest(nodes);

    expect(forest).toHaveLength(1);
    expect(forest[0]?.children.map((node) => node.name)).toEqual([
      "Sede Centro",
      "Sede Norte",
    ]);
    expect(flatten(forest).map((node) => [node.name, node.depth])).toEqual([
      ["Iglesia", 0],
      ["Sede Centro", 1],
      ["Jóvenes", 2],
      ["Célula", 3],
      ["Sede Norte", 1],
    ]);
  });

  it("makes a node whose parent is not visible a root", () => {
    expect(buildForest([cell]).map((node) => node.id)).toEqual(["g"]);
  });
});

describe("pickLandingNode", () => {
  const breadcrumb = { ...church, accessible: false };

  it("prefers the last visited node", () => {
    expect(pickLandingNode(nodes, "y")?.id).toBe("y");
  });

  it("falls back to the first location, then to any accessible node", () => {
    expect(pickLandingNode(nodes, "gone")?.type).toBe("LOCATION");
    expect(pickLandingNode([breadcrumb, cell], null)?.id).toBe("g");
    expect(pickLandingNode([breadcrumb], null)).toBeUndefined();
  });
});

describe("withIds", () => {
  it("drops nodes without id and tolerates no data", () => {
    expect(withIds([{ name: "x" }, church])).toEqual([church]);
    expect(withIds(undefined)).toEqual([]);
  });
});
