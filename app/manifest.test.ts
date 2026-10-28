import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "./manifest";
import { siteName, themeColor } from "./site";

describe("manifest", () => {
  const app = manifest();

  it("opens the portal as a standalone app", () => {
    expect(app).toMatchObject({
      name: siteName,
      start_url: "/portal",
      display: "standalone",
      theme_color: themeColor,
    });
  });

  it("offers the icons browsers need to install it", () => {
    const sizes = app.icons?.map((icon) => icon.sizes);
    expect(sizes).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(app.icons?.some((icon) => icon.purpose === "maskable")).toBe(true);
  });

  it("points every icon to a file in public/", () => {
    for (const icon of app.icons ?? []) {
      expect(existsSync(join(process.cwd(), "public", icon.src))).toBe(true);
    }
  });
});
