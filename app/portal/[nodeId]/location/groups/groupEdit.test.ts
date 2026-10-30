import { describe, expect, it } from "vitest";
import {
  toGroupInitialValues,
  toUpdateLocationChildRequest,
} from "./groupEdit";
import type { GroupInitialValues } from "./GroupForm";
import { emptySocialLinks } from "@/app/(components)/SocialLinks";

describe("toGroupInitialValues", () => {
  it("maps the group fields, without any people", () => {
    const values = toGroupInitialValues({
      name: "Jóvenes",
      description: "Sábados",
      type: "GROUP",
    });

    expect(values).toEqual({
      name: "Jóvenes",
      description: "Sábados",
      type: "GROUP",
      socialLinks: emptySocialLinks,
      schedule: "",
      memberVisibility: "PUBLIC",
      showOrgChart: true,
    });
  });

  it("brings the schedule and visibility of the group", () => {
    const values = toGroupInitialValues({
      type: "GROUP",
      schedule: "Viernes",
      memberVisibility: "LEADERS",
      showOrgChart: false,
    });

    expect(values).toMatchObject({
      schedule: "Viernes",
      memberVisibility: "LEADERS",
      showOrgChart: false,
    });
  });

  it("uses empty strings for a missing name or description", () => {
    const values = toGroupInitialValues({ type: "GROUP" });

    expect(values.name).toBe("");
    expect(values.description).toBe("");
  });

  it("maps any type other than MINISTRY to GROUP", () => {
    expect(toGroupInitialValues({ type: "MINISTRY" }).type).toBe("MINISTRY");
    expect(toGroupInitialValues({ type: "GROUP" }).type).toBe("GROUP");
    expect(toGroupInitialValues({}).type).toBe("GROUP");
  });
});

describe("toUpdateLocationChildRequest", () => {
  it("sends only the group data, never its people", () => {
    const values: GroupInitialValues = {
      name: "Jóvenes - Editado",
      description: "Sábados",
      type: "MINISTRY",
      socialLinks: { ...emptySocialLinks, instagramUrl: "https://ig.com/j" },
      schedule: " Viernes 7 pm ",
      memberVisibility: "MEMBERS",
      showOrgChart: true,
    };

    const request = toUpdateLocationChildRequest(values);

    expect(request).toEqual({
      name: "Jóvenes - Editado",
      description: "Sábados",
      type: "MINISTRY",
      socialLinks: { instagramUrl: "https://ig.com/j" },
      schedule: "Viernes 7 pm",
      memberVisibility: "MEMBERS",
      showOrgChart: true,
    });
    expect(request).not.toHaveProperty("leaderIds");
    expect(request).not.toHaveProperty("memberIds");
  });
});
