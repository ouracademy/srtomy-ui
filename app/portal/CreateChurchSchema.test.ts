import { describe, expect, it } from "vitest";
import {
  createChurchSchema,
  emptyCreateChurchForm,
  initialCreateChurchForm,
  toCreateChurchRequest,
} from "./CreateChurchSchema";

const levels = [
  { id: "l-admin", name: "Administrador" },
  { id: "l-leader", name: "Líder" },
  { id: "l-collab", name: "Colaborador" },
];

const creator = { firstName: "Ana", lastName: "Diaz", positionName: "Pastor" };

describe("createChurchSchema", () => {
  it("needs a church name and a first location", () => {
    const result = createChurchSchema.safeParse({
      ...emptyCreateChurchForm,
      creator,
      location: { ...emptyCreateChurchForm.location, name: " " },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual([
      "name",
      "location.name",
    ]);
  });
});

describe("createChurchSchema creator", () => {
  it("needs the creator's names", () => {
    const result = createChurchSchema.safeParse({
      ...emptyCreateChurchForm,
      name: "Iglesia",
    });

    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual([
      "creator.firstName",
      "creator.lastName",
    ]);
  });
});

describe("initialCreateChurchForm", () => {
  it("offers the suggested positions with the level they usually have", () => {
    const form = initialCreateChurchForm(levels);

    expect(form.positions).toEqual([
      { name: "Pastor", accessRoleId: "l-admin" },
      { name: "Líder de alabanza", accessRoleId: "l-leader" },
      { name: "Servidor", accessRoleId: "l-collab" },
      { name: "Maestro", accessRoleId: "l-collab" },
    ]);
    expect(form.creator.positionName).toBe("Pastor");
  });

  it("leaves a position without level when the church has no such level", () => {
    const form = initialCreateChurchForm([]);

    expect(form.positions.every((p) => p.accessRoleId === "none")).toBe(true);
  });
});

describe("toCreateChurchRequest", () => {
  it("trims, drops blanks and the bare phone prefix", () => {
    const request = toCreateChurchRequest({
      ...emptyCreateChurchForm,
      name: " Iglesia Vida ",
      socialLinks: {
        ...emptyCreateChurchForm.socialLinks,
        youtubeUrl: "https://yt.com/v",
      },
      positions: [
        { name: "Pastor", accessRoleId: "l-admin" },
        { name: " ", accessRoleId: "l-leader" },
        { name: " Hermano ", accessRoleId: "none" },
      ],
      creator: { ...creator, firstName: " Ana ", positionName: " " },
    });

    expect(request).toEqual({
      name: "Iglesia Vida",
      socialLinks: { youtubeUrl: "https://yt.com/v" },
      location: {
        name: "Sede principal",
        address: undefined,
        phoneNumber: undefined,
      },
      positions: [
        { name: "Pastor", accessRoleId: "l-admin" },
        { name: "Hermano", accessRoleId: undefined },
      ],
      creator: { firstName: "Ana", lastName: "Diaz", positionName: undefined },
    });
  });

  it("keeps a real phone and address", () => {
    const request = toCreateChurchRequest({
      ...emptyCreateChurchForm,
      name: "X",
      creator,
      location: {
        name: "Centro",
        address: "Av. 1",
        phoneNumber: "+51987654321",
      },
    });

    expect(request.location).toEqual({
      name: "Centro",
      address: "Av. 1",
      phoneNumber: "+51987654321",
    });
  });
});
