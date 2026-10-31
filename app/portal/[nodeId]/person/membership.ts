import type { MemberState } from "@/app/(components)/memberState";

/** The body of PUT /people/{id}/memberships/{nodeId}. */
export const membershipBody = (memberState: MemberState) => ({ memberState });
