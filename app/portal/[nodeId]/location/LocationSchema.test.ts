import { describe, expect, it } from "vitest";
import {
  organizationSchema,
  toOrganizationForm,
  toOrganizationPayload,
} from "./LocationSchema";
import { emptySocialLinks } from "@/app/(components)/SocialLinks";

describe("organizationSchema", () => {
  it("only requires a name", () => {
    const values = {
      name: "Sede",
      address: "",
      phoneNumber: "",
      socialLinks: emptySocialLinks,
    };
    expect(organizationSchema.safeParse(values).success).toBe(true);
    expect(organizationSchema.safeParse({ ...values, name: " " }).success).toBe(
      false,
    );
  });
});

describe("conversions", () => {
  it("fills blanks from the API and keeps the description on save", () => {
    const form = toOrganizationForm({
      name: "Sede Norte",
      socialLinks: { facebookUrl: "https://fb.com/n" },
    });
    expect(form).toEqual({
      name: "Sede Norte",
      address: "",
      phoneNumber: "",
      socialLinks: { ...emptySocialLinks, facebookUrl: "https://fb.com/n" },
    });

    expect(
      toOrganizationPayload(form, { description: "Principal", parentId: "c" }),
    ).toEqual({
      name: "Sede Norte",
      description: "Principal",
      address: "",
      phoneNumber: "",
      socialLinks: { facebookUrl: "https://fb.com/n" },
      parentId: "c",
    });
    expect(toOrganizationPayload(form, {}).description).toBe("");
  });
});
