/**
 * Name of the node an item comes from, or `undefined` when it belongs to the
 * node being viewed (no label needed).
 */
export function originLabel(
  originId: string | undefined,
  originName: string | undefined,
  currentNodeId: string,
): string | undefined {
  return originId !== currentNodeId && originName ? originName : undefined;
}

/** `Culto · Jóvenes` when the event belongs to a descendant, else just the title. */
export function titleWithOrigin(title: string, label: string | undefined) {
  return label ? `${title} · ${label}` : title;
}
