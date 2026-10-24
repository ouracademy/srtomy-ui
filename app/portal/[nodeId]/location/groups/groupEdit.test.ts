import { describe, expect, it } from "vitest";
import {
  toGroupInitialValues,
  toUpdateLocationChildRequest,
} from "./groupEdit";
import type { GroupInitialValues } from "./GroupForm";
import { emptySocialLinks } from "@/app/(components)/SocialLinks";

const LEADER_ID = "11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const MEMBER_ID = "22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

describe("toGroupInitialValues", () => {
  it("maps the group fields and the members and leaders with their full names", () => {
    const values = toGroupInitialValues(
      { name: "Jóvenes", description: "Sábados", type: "GROUP" },
      {
        LEADER: [{ id: LEADER_ID, firstName: "Juan", lastName: "Perez" }],
        IS_PART_OF: [{ id: MEMBER_ID, firstName: "Maria", lastName: "Garcia" }],
      },
    );

    expect(values).toEqual({
      name: "Jóvenes",
      description: "Sábados",
      type: "GROUP",
      leaders: [{ id: LEADER_ID, label: "Juan Perez" }],
      members: [{ id: MEMBER_ID, label: "Maria Garcia" }],
      socialLinks: emptySocialLinks,
      inviteLeaders: true,
    });
  });

  it("uses empty strings for a missing name or description", () => {
    const values = toGroupInitialValues({ type: "GROUP" }, {});

    expect(values.name).toBe("");
    expect(values.description).toBe("");
  });

  it("maps any type other than MINISTRY to GROUP", () => {
    expect(toGroupInitialValues({ type: "MINISTRY" }, {}).type).toBe(
      "MINISTRY",
    );
    expect(toGroupInitialValues({ type: "GROUP" }, {}).type).toBe("GROUP");
    expect(toGroupInitialValues({}, {}).type).toBe("GROUP");
  });

  it("returns empty lists when the members response has no IS_PART_OF or LEADER", () => {
    const values = toGroupInitialValues({ type: "GROUP" }, {});

    expect(values.members).toEqual([]);
    expect(values.leaders).toEqual([]);
  });
});

describe("toUpdateLocationChildRequest", () => {
  it("sends only the ids of leaders and members, with the form's type and text", () => {
    const values: GroupInitialValues = {
      name: "Jóvenes - Editado",
      description: "Sábados",
      type: "MINISTRY",
      inviteLeaders: true,
      leaders: [
        { id: LEADER_ID, label: "Juan Perez", email: "juan@x.org" },
        { id: MEMBER_ID, label: "Maria Garcia" },
      ],
      members: [{ id: MEMBER_ID, label: "Maria Garcia" }],
      socialLinks: { ...emptySocialLinks, instagramUrl: "https://ig.com/j" },
    };

    expect(toUpdateLocationChildRequest(values)).toEqual({
      name: "Jóvenes - Editado",
      description: "Sábados",
      type: "MINISTRY",
      leaderIds: [LEADER_ID, MEMBER_ID],
      memberIds: [MEMBER_ID],
      socialLinks: { instagramUrl: "https://ig.com/j" },
    });
  });
});
