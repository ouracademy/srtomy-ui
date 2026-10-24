import { describe, expect, it } from "vitest";
import {
  emptySocialLinks,
  socialLinksSchema,
  toSocialLinksForm,
  toSocialLinksRequest,
} from "./SocialLinks";

describe("socialLinksSchema", () => {
  it("accepts blank and http(s) links", () => {
    const values = {
      ...emptySocialLinks,
      youtubeUrl: "https://youtube.com/@iglesia",
    };
    expect(socialLinksSchema.safeParse(values).success).toBe(true);
  });

  it("rejects a link without scheme", () => {
    const result = socialLinksSchema.safeParse({
      ...emptySocialLinks,
      tiktokUrl: "tiktok.com/x",
    });
    expect(result.success).toBe(false);
  });
});

describe("conversions", () => {
  it("fills missing links with blanks", () => {
    expect(toSocialLinksForm({ website: "https://x.org" })).toEqual({
      ...emptySocialLinks,
      website: "https://x.org",
    });
    expect(toSocialLinksForm(undefined)).toEqual(emptySocialLinks);
  });

  it("sends only the links that were filled", () => {
    expect(
      toSocialLinksRequest({
        ...emptySocialLinks,
        facebookUrl: " https://fb.com/x ",
      }),
    ).toEqual({ facebookUrl: "https://fb.com/x" });
  });
});
