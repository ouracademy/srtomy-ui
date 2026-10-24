import { describe, expect, it } from "vitest";
import {
  accessSummary,
  generalAccessLabels,
  generalAccessOptions,
  linkRolesFor,
  sharedEventPath,
} from "./eventSharing";

describe("linkRolesFor", () => {
  it("offers signing up only for courses", () => {
    expect(linkRolesFor(true)).toEqual(["VIEWER", "REGISTRANT"]);
    expect(linkRolesFor(false)).toEqual(["VIEWER"]);
  });
});

describe("accessSummary", () => {
  it.each([
    ["RESTRICTED", "VIEWER", "Solo ven el evento las personas con acceso."],
    [
      "CHURCH",
      "VIEWER",
      "Las personas de la iglesia con el enlace pueden ver el evento.",
    ],
    [
      "CHURCH",
      "REGISTRANT",
      "Las personas de la iglesia con el enlace pueden ver el curso e inscribirse.",
    ],
    [
      "ANYONE_WITH_LINK",
      "VIEWER",
      "Cualquiera con el enlace puede ver el evento.",
    ],
    [
      "ANYONE_WITH_LINK",
      "REGISTRANT",
      "Cualquiera con el enlace puede ver el curso e inscribirse.",
    ],
  ] as const)("%s + %s", (access, role, expected) => {
    expect(accessSummary(access, role)).toBe(expected);
  });
});

describe("labels and paths", () => {
  it("explains every general access", () => {
    for (const option of generalAccessOptions) {
      expect(generalAccessLabels[option].label).not.toBe("");
      expect(generalAccessLabels[option].help).not.toBe("");
    }
  });

  it("the shared page lives under /e/{slug}", () => {
    expect(sharedEventPath("abc")).toBe("/e/abc");
  });
});
