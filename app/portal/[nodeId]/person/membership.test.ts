import { describe, expect, it } from "vitest";
import {
  canHaveLeaders,
  leadershipChanged,
  membershipBody,
} from "./membership";

describe("membership", () => {
  it("only groups and ministries have leaders", () => {
    expect(canHaveLeaders("GROUP")).toBe(true);
    expect(canHaveLeaders("MINISTRY")).toBe(true);
    expect(canHaveLeaders("LOCATION")).toBe(false);
    expect(canHaveLeaders("CHURCH")).toBe(false);
    expect(canHaveLeaders(undefined)).toBe(false);
  });

  it("notices when leadership changes", () => {
    expect(leadershipChanged(false, true)).toBe(true);
    expect(leadershipChanged(true, false)).toBe(true);
    expect(leadershipChanged(true, true)).toBe(false);
    expect(leadershipChanged(false, false)).toBe(false);
  });

  it("builds the request body", () => {
    expect(membershipBody("MEMBER", true)).toEqual({
      memberState: "MEMBER",
      leader: true,
    });
  });
});
