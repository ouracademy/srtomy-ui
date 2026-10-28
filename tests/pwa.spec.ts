import { test, expect } from "./fixtures";

test.describe("PWA", () => {
  test("sirve el manifest para poder instalar la app", async ({ request }) => {
    const response = await request.get("/manifest.webmanifest");

    expect(response.status()).toBe(200);
    const manifest = await response.json();
    expect(manifest).toMatchObject({
      name: "Sr. Tommy",
      display: "standalone",
      start_url: "/portal",
    });
    for (const icon of manifest.icons) {
      expect((await request.get(icon.src)).status()).toBe(200);
    }
  });
});
