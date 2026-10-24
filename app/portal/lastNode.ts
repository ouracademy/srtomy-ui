// Remembers the node (church, location, group...) the user last opened, so the
// portal can take them back there. Storage may be unavailable (private mode,
// blocked site data); the portal then just lands on a default node.
const KEY = "srtomy.lastNode";

export const readLastNode = (): string | null => {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const saveLastNode = (nodeId: string) => {
  try {
    window.localStorage.setItem(KEY, nodeId);
  } catch {
    // Nothing to do: remembering the node is a convenience.
  }
};
