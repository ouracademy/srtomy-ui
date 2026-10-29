import { describe, expect, it } from "vitest";
import type { OrganizationNode } from "@/app/portal/organizationTree";
import { addableNodes } from "./addableNodes";

const node = (
  id: string,
  name: string,
  parentId?: string,
  accessible = true,
): OrganizationNode => ({ id, name, parentId, accessible, type: "GROUP" });

const nodes = [
  node("c1", "Iglesia"),
  node("l1", "Sede", "c1"),
  node("g1", "Jóvenes", "l1"),
  node("g2", "Alabanza", "l1"),
  node("g3", "Privado", "l1", false),
  node("c2", "Otra iglesia"),
  node("x1", "De otra", "c2"),
];

describe("addableNodes", () => {
  it("lists the nodes of the church the person is not in yet, parents first", () => {
    expect(addableNodes(nodes, "g1", ["g1"]).map((n) => n.id)).toEqual([
      "c1",
      "l1",
      "g2",
    ]);
  });

  it("leaves out what the user cannot open and other churches", () => {
    const ids = addableNodes(nodes, "l1", []).map((n) => n.id);

    expect(ids).not.toContain("g3");
    expect(ids).not.toContain("x1");
    expect(ids).not.toContain("c2");
  });

  it("is empty when the node is unknown", () => {
    expect(addableNodes(nodes, "nope", [])).toEqual([]);
  });
});
