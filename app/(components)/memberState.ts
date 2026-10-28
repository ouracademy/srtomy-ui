// How involved a person is with the church, in the words of the screens. The
// values are the API's (the states of a person in a node).
export const memberStates = [
  "VISITOR",
  "MEMBERSHIP_IN_PROGRESS",
  "MEMBER",
] as const;
export type MemberState = (typeof memberStates)[number];

export const memberStateLabels: Record<MemberState, string> = {
  VISITOR: "Visitante",
  MEMBERSHIP_IN_PROGRESS: "Asistente",
  MEMBER: "Miembro",
};

export const memberStateHelp =
  "Visitante: viene por primera vez. Asistente: viene seguido y va camino a ser miembro. Quien tiene un cargo es miembro.";

export const isMemberState = (value: unknown): value is MemberState =>
  memberStates.includes(value as MemberState);

// Whoever holds a position is a member, whatever was chosen.
export const effectiveMemberState = (
  chosen: MemberState,
  positionCount: number,
): MemberState => (positionCount > 0 ? "MEMBER" : chosen);
