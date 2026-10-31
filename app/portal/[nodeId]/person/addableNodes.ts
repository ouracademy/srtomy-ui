import {
  churchOf,
  flatten,
  buildForest,
  type OrganizationNode,
} from "@/app/portal/organizationTree";

/**
 * The nodes of the church of `nodeId` where a person could still be added:
 * every node of that church the user can open, but the ones they already
 * belong to. Parents come before their children.
 */
export const addableNodes = (
  nodes: OrganizationNode[],
  nodeId: string,
  alreadyIn: readonly string[],
): OrganizationNode[] => {
  const church = churchOf(nodes, nodeId);
  if (!church) return [];
  const sameChurch = nodes.filter(
    (node) => churchOf(nodes, node.id)?.id === church.id,
  );
  return flatten(buildForest(sameChurch)).filter(
    (node) => node.accessible && !alreadyIn.includes(node.id),
  );
};
