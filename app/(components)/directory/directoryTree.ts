import type { DirectoryNodeResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";

export type DirectoryNode = DirectoryNodeResponse & { id: string };

export type DirectoryTreeNode = DirectoryNode & {
  depth: number;
  children: DirectoryTreeNode[];
};

const byName = (a: DirectoryNode, b: DirectoryNode) =>
  (a.name ?? "").localeCompare(b.name ?? "", "es", { sensitivity: "base" });

// The directory comes flat (the church first); this rebuilds the tree with
// each node's depth, children sorted by name. A node whose parent is not in
// the list is a root.
export const buildDirectoryTree = (
  nodes: DirectoryNodeResponse[],
): DirectoryTreeNode[] => {
  const known = nodes.filter((node): node is DirectoryNode => Boolean(node.id));
  const ids = new Set(known.map((node) => node.id));
  const childrenOf = new Map<string, DirectoryNode[]>();
  for (const node of known) {
    if (node.parentId && ids.has(node.parentId)) {
      childrenOf.set(node.parentId, [
        ...(childrenOf.get(node.parentId) ?? []),
        node,
      ]);
    }
  }
  const build = (node: DirectoryNode, depth: number): DirectoryTreeNode => ({
    ...node,
    depth,
    children: (childrenOf.get(node.id) ?? [])
      .sort(byName)
      .map((child) => build(child, depth + 1)),
  });
  return known
    .filter((node) => !node.parentId || !ids.has(node.parentId))
    .sort(byName)
    .map((root) => build(root, 0));
};

// The tree in reading order, for rendering a flat indented list.
export const flattenTree = (roots: DirectoryTreeNode[]): DirectoryTreeNode[] =>
  roots.flatMap((root) => [root, ...flattenTree(root.children)]);
