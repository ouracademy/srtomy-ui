import { describe, expect, it } from "vitest";
import {
  effectiveMemberState,
  isMemberState,
  memberStateFromParam,
  memberStateLabels,
  memberStates,
} from "./memberState";

describe("memberState", () => {
  it("names every state", () => {
    for (const state of memberStates) {
      expect(memberStateLabels[state]).not.toBe("");
    }
    expect(memberStateLabels.MEMBERSHIP_IN_PROGRESS).toBe("Asistente");
  });

  it("knows which values are states", () => {
    expect(isMemberState("VISITOR")).toBe(true);
    expect(isMemberState("IS_PART_OF")).toBe(false);
    expect(isMemberState(undefined)).toBe(false);
  });

  it("a position makes a person a member whatever was chosen", () => {
    expect(effectiveMemberState("VISITOR", 1)).toBe("MEMBER");
    expect(effectiveMemberState("VISITOR", 0)).toBe("VISITOR");
    expect(effectiveMemberState("MEMBERSHIP_IN_PROGRESS", 0)).toBe(
      "MEMBERSHIP_IN_PROGRESS",
    );
  });

  it("reads a state from a url parameter", () => {
    expect(memberStateFromParam("MEMBER")).toBe("MEMBER");
    expect(memberStateFromParam("nope")).toBeUndefined();
    expect(memberStateFromParam(null)).toBeUndefined();
  });
});
