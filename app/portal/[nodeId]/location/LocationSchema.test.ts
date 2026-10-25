import { describe, expect, it } from "vitest";
import {
  organizationSchema,
  toOrganizationForm,
  toOrganizationPayload,
} from "./LocationSchema";
import { defaultVisibility } from "@/app/(components)/visibility";
import { emptySocialLinks } from "@/app/(components)/SocialLinks";

describe("organizationSchema", () => {
  it("only requires a name", () => {
    const values = {
      name: "Sede",
      address: "",
      phoneNumber: "",
      socialLinks: emptySocialLinks,
      ...defaultVisibility,
    };
    expect(organizationSchema.safeParse(values).success).toBe(true);
    expect(organizationSchema.safeParse({ ...values, name: " " }).success).toBe(
      false,
    );
  });
});

describe("conversions", () => {
  it("carries the schedule and visibility of the node both ways", () => {
    const form = toOrganizationForm({
      name: "Sede Norte",
      schedule: "Domingos 10 am",
      memberVisibility: "CHURCH",
      showOrgChart: false,
    });

    expect(form).toMatchObject({
      schedule: "Domingos 10 am",
      memberVisibility: "CHURCH",
      showOrgChart: false,
    });
    expect(toOrganizationPayload(form, {})).toMatchObject({
      schedule: "Domingos 10 am",
      memberVisibility: "CHURCH",
      showOrgChart: false,
    });
  });

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
      ...defaultVisibility,
    });

    expect(
      toOrganizationPayload(form, { description: "Principal", parentId: "c" }),
    ).toEqual({
      name: "Sede Norte",
      description: "Principal",
      address: "",
      phoneNumber: "",
      socialLinks: { facebookUrl: "https://fb.com/n" },
      schedule: "",
      memberVisibility: "PUBLIC",
      showOrgChart: true,
      parentId: "c",
    });
    expect(toOrganizationPayload(form, {}).description).toBe("");
  });
});
