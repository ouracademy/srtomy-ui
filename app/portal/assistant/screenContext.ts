import type { ScreenContext } from "@/app/(api)/assistant";

// Portal segments right under /portal that are not a node.
const notNodes = new Set(["me", "profile"]);
// Segments under /person and /event that are screens, not ids.
const notIds = new Set(["create", "new"]);

// The screen the user has open, read from the route:
// /portal/[nodeId]/event/[id]/... and /portal/[nodeId]/person/[id]. Undefined
// outside a node (Mi espacio, the profile, the church sign-up): the agent
// needs a node to work on.
export const screenContextFrom = (
  pathname: string,
  timeZone?: string,
): ScreenContext | undefined => {
  const [portal, nodeId, section, id] = pathname
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);
  if (portal !== "portal" || !nodeId || notNodes.has(nodeId)) return undefined;

  const context: ScreenContext = { nodeId };
  const entityId = id && !notIds.has(id) ? id : undefined;
  if (section === "event" && entityId) context.eventId = entityId;
  if (section === "person" && entityId) context.personId = entityId;
  if (timeZone) context.timeZone = timeZone;
  return context;
};

// The browser's IANA time zone ("America/Lima"), so "today" and "Sunday" mean
// the user's days.
export const browserTimeZone = (): string | undefined => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
};
