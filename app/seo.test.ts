import { describe, expect, it } from "vitest";
import robots from "./robots";
import { siteDescription, siteUrl } from "./site";
import sitemap from "./sitemap";

describe("seo", () => {
  it("keeps the description within search snippet length", () => {
    expect(siteDescription.length).toBeLessThanOrEqual(200);
  });

  it("blocks the portal and points to the sitemap", () => {
    const { rules, sitemap: map } = robots();
    expect(rules).toMatchObject({ allow: "/", disallow: "/portal" });
    expect(map).toBe(`${siteUrl}/sitemap.xml`);
  });

  it("lists the public pages and not the portal", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls).toContain(siteUrl);
    expect(urls.some((url) => url.includes("/portal"))).toBe(false);
  });
});
