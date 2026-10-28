import { describe, expect, it } from "vitest";
import {
  accessSummary,
  emailLooksValid,
  generalAccessLabels,
  generalAccessOptions,
  hasUnsavedChanges,
  sharedEventPath,
  withShare,
  type SharingDraft,
} from "./eventSharing";

describe("accessSummary", () => {
  it.each([
    ["RESTRICTED", "Solo ven el evento las personas con acceso."],
    [
      "CHURCH",
      "Las personas de la iglesia con el enlace pueden ver el evento.",
    ],
    ["ANYONE_WITH_LINK", "Cualquiera con el enlace puede ver el evento."],
  ] as const)("%s", (access, expected) => {
    expect(accessSummary(access)).toBe(expected);
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

describe("hasUnsavedChanges", () => {
  const none: SharingDraft = {
    generalAccess: "CHURCH",
    added: [],
    removed: [],
  };

  it("is false while the draft equals what is saved", () => {
    expect(hasUnsavedChanges("CHURCH", none)).toBe(false);
  });

  it("is true for a different general access, a new person or a removal", () => {
    expect(hasUnsavedChanges("RESTRICTED", none)).toBe(true);
    expect(
      hasUnsavedChanges("CHURCH", {
        ...none,
        added: [{ email: "a@x.org", role: "VIEWER" }],
      }),
    ).toBe(true);
    expect(hasUnsavedChanges("CHURCH", { ...none, removed: ["s1"] })).toBe(
      true,
    );
  });
});

describe("withShare", () => {
  it("replaces the role of an email that was already added, ignoring case", () => {
    const first = withShare([], { email: "Ana@x.org", role: "VIEWER" });
    const second = withShare(first, { email: "ana@X.org", role: "EDITOR" });

    expect(second).toEqual([{ email: "ana@X.org", role: "EDITOR" }]);
  });

  it("keeps the others", () => {
    const list = withShare([{ email: "a@x.org", role: "VIEWER" }], {
      email: "b@x.org",
      role: "EDITOR",
    });

    expect(list.map((item) => item.email)).toEqual(["a@x.org", "b@x.org"]);
  });
});

describe("emailLooksValid", () => {
  it("accepts an address and rejects what is not one", () => {
    expect(emailLooksValid(" ana@x.org ")).toBe(true);
    expect(emailLooksValid("ana")).toBe(false);
    expect(emailLooksValid("ana@x")).toBe(false);
  });
});
