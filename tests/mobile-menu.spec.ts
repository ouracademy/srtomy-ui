import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";

const nodeId = "11111111-1111-1111-1111-111111111111";

const json = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

test.describe("Menú en móvil", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.route(`**/organizations/${nodeId}`, (route) =>
      route.fulfill(
        json({ id: nodeId, name: "Sede Central", type: "LOCATION" }),
      ),
    );
    await page.route("**/organizations/*/positions**", (route) =>
      route.fulfill(json([])),
    );
    await page.route("**/organizations/*/childs**", (route) =>
      route.fulfill(json([])),
    );
    await page.route("**/people**", (route) =>
      route.fulfill(json({ content: [] })),
    );
  });

  test("las opciones del menú se ven al abrirlo", async ({ page }) => {
    await page.goto(`/portal/${nodeId}/location`);
    await page.getByRole("button", { name: "Abrir menú" }).click();

    const navigation = page.getByRole("list", { name: "Menú principal" });
    for (const label of [
      "Dashboard",
      "Sede",
      "Personas",
      "Eventos y cursos",
      "Cargos y accesos",
    ]) {
      await expect(navigation.getByText(label, { exact: true })).toBeVisible();
    }
  });

  test("el texto del menú tiene contraste suficiente", async ({ page }) => {
    await page.goto(`/portal/${nodeId}/location`);
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await expect(
      page.getByRole("list", { name: "Menú principal" }),
    ).toBeVisible();

    const { violations } = await new AxeBuilder({ page })
      .include(".MuiDrawer-paper")
      .withRules(["color-contrast"])
      .analyze();

    expect(
      violations.flatMap((v) => v.nodes.map((n) => n.target.join(" "))),
    ).toEqual([]);
  });
});
