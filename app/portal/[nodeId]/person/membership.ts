import type { MemberState } from "@/app/(components)/memberState";

/** Only a group or a ministry has leaders. */
export const canHaveLeaders = (nodeType: string | undefined) =>
  nodeType === "GROUP" || nodeType === "MINISTRY";

/**
 * Whether saving a person must also tell the API about their leadership of the
 * node: POST/PUT /people do not carry it. Skipped when nothing changed.
 */
export const leadershipChanged = (wasLeader: boolean, isLeader: boolean) =>
  wasLeader !== isLeader;

/** The body of PUT /people/{id}/memberships/{nodeId}. */
export const membershipBody = (memberState: MemberState, leader: boolean) => ({
  memberState,
  leader,
});
