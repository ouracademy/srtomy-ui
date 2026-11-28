// The steps of accepting an invitation from a list. An invitation that needs
// a name takes two clicks: the first one opens the name fields, the second one
// accepts with them. This replaces three separate flags (`accepting`,
// `asking` and `triedWithoutName`) that could disagree.
export type AcceptFlow =
  | { kind: "idle" }
  // The name fields of this invitation are open. `triedWithoutName` is set
  // when the person pressed accept without both names.
  | { kind: "askingName"; id: string; triedWithoutName: boolean }
  // The request is in flight. `askedName` remembers that the fields were open,
  // so a refusal leaves them open for another try.
  | { kind: "accepting"; id: string; askedName: boolean };

export type AcceptEvent =
  // A click on accept of this invitation.
  | { type: "click"; id: string; needsName: boolean; hasName: boolean }
  // The request ended, accepted or refused.
  | { type: "answered" };

export const initialAcceptFlow: AcceptFlow = { kind: "idle" };

// Whether this click goes on to the request (true) or only moves the form.
export const sendsRequest = (flow: AcceptFlow, event: AcceptEvent) =>
  flow.kind !== "accepting" &&
  event.type === "click" &&
  (!event.needsName ||
    (flow.kind === "askingName" && flow.id === event.id && event.hasName));

export const acceptReducer = (
  flow: AcceptFlow,
  event: AcceptEvent,
): AcceptFlow => {
  if (event.type === "answered") {
    return flow.kind === "accepting" && flow.askedName
      ? { kind: "askingName", id: flow.id, triedWithoutName: false }
      : flow.kind === "accepting"
        ? { kind: "idle" }
        : flow;
  }
  if (flow.kind === "accepting") return flow;
  if (sendsRequest(flow, event)) {
    return {
      kind: "accepting",
      id: event.id,
      askedName: flow.kind === "askingName" && flow.id === event.id,
    };
  }
  // It needs a name and there is none yet: open the fields, or flag them.
  return {
    kind: "askingName",
    id: event.id,
    triedWithoutName: flow.kind === "askingName" && flow.id === event.id,
  };
};
