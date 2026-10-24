import type { MyOrganizationResponse } from "@/app/(api)/generated/aPISrTommy.schemas";

// The API returns the user's nodes flat (GET /me/organizations); these helpers
// rebuild what the screens need: breadcrumbs, the church of a node, and a tree.

export type OrganizationNode = MyOrganizationResponse & { id: string };

export type OrganizationTreeNode = OrganizationNode & {
  depth: number;
  children: OrganizationTreeNode[];
};

const byId = (nodes: OrganizationNode[]) =>
  new Map(nodes.map((node) => [node.id, node]));

/** The chain from the church down to `id` (both included), or [] if unknown. */
export const pathTo = (
  nodes: OrganizationNode[],
  id: string,
): OrganizationNode[] => {
  const index = byId(nodes);
  const path: OrganizationNode[] = [];
  let current = index.get(id);
  while (current && !path.includes(current)) {
    path.unshift(current);
    current = current.parentId ? index.get(current.parentId) : undefined;
  }
  return path;
};

/** The church (tree root) that `id` belongs to. */
export const churchOf = (
  nodes: OrganizationNode[],
  id: string,
): OrganizationNode | undefined => pathTo(nodes, id)[0];

/** One tree per church, children sorted by name, with their depth. */
export const buildForest = (
  nodes: OrganizationNode[],
): OrganizationTreeNode[] => {
  const childrenOf = new Map<string | undefined, OrganizationNode[]>();
  for (const node of nodes) {
    const siblings = childrenOf.get(node.parentId) ?? [];
    siblings.push(node);
    childrenOf.set(node.parentId, siblings);
  }
  const ids = new Set(nodes.map((node) => node.id));
  const build = (
    node: OrganizationNode,
    depth: number,
  ): OrganizationTreeNode => ({
    ...node,
    depth,
    children: sortByName(childrenOf.get(node.id) ?? []).map((child) =>
      build(child, depth + 1),
    ),
  });
  // A root is a church, or a node whose parent the user cannot see.
  const roots = nodes.filter(
    (node) => !node.parentId || !ids.has(node.parentId),
  );
  return sortByName(roots).map((root) => build(root, 0));
};

/** Depth-first list of a forest, handy to render it as an indented list. */
export const flatten = (
  forest: OrganizationTreeNode[],
): OrganizationTreeNode[] =>
  forest.flatMap((node) => [node, ...flatten(node.children)]);

/**
 * Where to land after sign-in: the last visited node if the user can still
 * open it, else their first location, else any node they can open.
 */
export const pickLandingNode = (
  nodes: OrganizationNode[],
  lastVisited: string | null,
): OrganizationNode | undefined => {
  const accessible = nodes.filter((node) => node.accessible);
  return (
    accessible.find((node) => node.id === lastVisited) ??
    accessible.find((node) => node.type === "LOCATION") ??
    accessible[0]
  );
};

const sortByName = <T extends { name?: string }>(list: T[]) =>
  [...list].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "", "es"));

/** Keeps only the nodes with an id (the API always sends one). */
export const withIds = (
  nodes: MyOrganizationResponse[] | undefined,
): OrganizationNode[] =>
  (nodes ?? []).filter((node): node is OrganizationNode => Boolean(node.id));

export const nodeTypeLabels: Record<string, string> = {
  CHURCH: "Iglesia",
  LOCATION: "Sede",
  GROUP: "Grupo",
  MINISTRY: "Ministerio",
};
