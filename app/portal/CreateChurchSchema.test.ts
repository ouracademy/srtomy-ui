import { describe, expect, it } from "vitest";
import {
  createChurchSchema,
  emptyCreateChurchForm,
  toCreateChurchRequest,
} from "./CreateChurchSchema";

describe("createChurchSchema", () => {
  it("needs a church name and a first location", () => {
    const result = createChurchSchema.safeParse({
      ...emptyCreateChurchForm,
      location: { ...emptyCreateChurchForm.location, name: " " },
    });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path.join("."))).toEqual([
      "name",
      "location.name",
    ]);
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
      positions: ["Pastor", " ", " Ujier "],
    });

    expect(request).toEqual({
      name: "Iglesia Vida",
      socialLinks: { youtubeUrl: "https://yt.com/v" },
      location: {
        name: "Sede principal",
        address: undefined,
        phoneNumber: undefined,
      },
      positions: ["Pastor", "Ujier"],
    });
  });

  it("keeps a real phone and address", () => {
    const request = toCreateChurchRequest({
      ...emptyCreateChurchForm,
      name: "X",
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
