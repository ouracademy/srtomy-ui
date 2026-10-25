import { describe, expect, it } from "vitest";
import {
  defaultVisibility,
  memberVisibilities,
  memberVisibilityLabels,
  publicPagePath,
  toVisibilityForm,
  toVisibilityRequest,
} from "./visibility";

describe("toVisibilityForm", () => {
  it("takes the settings the API sent", () => {
    expect(
      toVisibilityForm({
        schedule: "Sábados 5 pm",
        memberVisibility: "LEADERS",
        showOrgChart: false,
      }),
    ).toEqual({
      schedule: "Sábados 5 pm",
      memberVisibility: "LEADERS",
      showOrgChart: false,
    });
  });

  it("falls back to public with the org chart when the API sent nothing", () => {
    expect(toVisibilityForm({})).toEqual(defaultVisibility);
    expect(defaultVisibility).toEqual({
      schedule: "",
      memberVisibility: "PUBLIC",
      showOrgChart: true,
    });
  });

  it("ignores a visibility it does not know", () => {
    expect(
      toVisibilityForm({ memberVisibility: "SECRET" }).memberVisibility,
    ).toBe("PUBLIC");
  });
});

describe("toVisibilityRequest", () => {
  it("trims the schedule and sends every setting", () => {
    expect(
      toVisibilityRequest({
        schedule: "  Viernes  ",
        memberVisibility: "MEMBERS",
        showOrgChart: true,
      }),
    ).toEqual({
      schedule: "Viernes",
      memberVisibility: "MEMBERS",
      showOrgChart: true,
    });
  });
});

describe("labels", () => {
  it("explain every visibility in Spanish", () => {
    for (const visibility of memberVisibilities) {
      expect(memberVisibilityLabels[visibility].label).not.toBe("");
      expect(memberVisibilityLabels[visibility].help).not.toBe("");
    }
  });

  it("the public page lives under /g/{slug}", () => {
    expect(publicPagePath("abc123")).toBe("/g/abc123");
  });
});
