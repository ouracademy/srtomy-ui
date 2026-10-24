import { describe, expect, it } from "vitest";
import { setGroup, togglePermission } from "./rolePermissions";

describe("togglePermission", () => {
  it("adds a missing permission and removes a present one", () => {
    expect(togglePermission(["org.read"], "events.read")).toEqual([
      "org.read",
      "events.read",
    ]);
    expect(togglePermission(["org.read", "events.read"], "org.read")).toEqual([
      "events.read",
    ]);
  });
});

describe("setGroup", () => {
  const group = ["iam.read", "iam.manage"];

  it("selects the whole group without duplicating", () => {
    expect(setGroup(["org.read", "iam.read"], group, true).sort()).toEqual([
      "iam.manage",
      "iam.read",
      "org.read",
    ]);
  });

  it("clears only that group", () => {
    expect(setGroup(["org.read", "iam.read"], group, false)).toEqual([
      "org.read",
    ]);
  });
});
