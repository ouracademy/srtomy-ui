import { describe, expect, it } from "vitest";
import {
  createChurchSchema,
  emptyCreateChurchForm,
  initialCreateChurchForm,
  toCreateChurchRequest,
} from "./CreateChurchSchema";

const suggestions = [
  { name: "Pastor", permissions: ["org.read", "members.write"] },
  { name: "Servidor", permissions: ["org.read"] },
  { name: "Intercesor", permissions: [] },
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
  it("starts with the usual positions and the permissions they usually give", () => {
    const form = initialCreateChurchForm(suggestions);

    expect(form.positions).toEqual([
      { name: "Pastor", permissions: ["org.read", "members.write"] },
      { name: "Líder de grupo", permissions: [] },
      { name: "Líder de ministerio", permissions: [] },
      { name: "Servidor", permissions: ["org.read"] },
      { name: "Maestro", permissions: [] },
    ]);
    expect(form.creator.positionName).toBe("Pastor");
  });
});

describe("initialCreateChurchForm creator", () => {
  it("starts with the name proposed from the sign-in profile", () => {
    const form = initialCreateChurchForm(suggestions, {
      firstName: "Ana",
      lastName: "Díaz",
    });

    expect(form.creator).toEqual({
      firstName: "Ana",
      lastName: "Díaz",
      positionName: "Pastor",
    });
  });

  it("starts with empty names when nothing is proposed", () => {
    expect(initialCreateChurchForm(suggestions).creator).toEqual({
      firstName: "",
      lastName: "",
      positionName: "Pastor",
    });
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
        { name: "Pastor", permissions: ["org.read"] },
        { name: " ", permissions: ["events.read"] },
        { name: " Hermano ", permissions: [] },
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
        { name: "Pastor", permissions: ["org.read"] },
        { name: "Hermano", permissions: [] },
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
