import { describe, expect, it } from "vitest";
import { membershipBody } from "./membership";

describe("membershipBody", () => {
  it("builds the request body", () => {
    expect(membershipBody("MEMBER")).toEqual({ memberState: "MEMBER" });
  });
});
