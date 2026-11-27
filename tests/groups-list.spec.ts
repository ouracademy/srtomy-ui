import { test, expect } from "./fixtures";
import { NODE_ID } from "./e2e-env";

const json = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

const groups = [
  { id: "g1", name: "Jóvenes", type: "GROUP", schedule: "Sábados 5 pm" },
  { id: "g2", name: "Alabanza", type: "MINISTRY", schedule: "Domingos 8 am" },
  { id: "g3", name: "Niños", type: "MINISTRY" },
];

test.describe("Lista de grupos y ministerios", { tag: "@story" }, () => {
  let remaining = groups;
  const deletes: string[] = [];

  test.beforeEach(async ({ page }) => {
    remaining = groups;
    deletes.length = 0;
    await page.route(`**/v1/organizations/${NODE_ID}`, (route) =>
      route.fulfill(
        json({ id: NODE_ID, name: "Sede Central", type: "LOCATION" }),
      ),
    );
    await page.route(`**/v1/organizations/${NODE_ID}/childs**`, (route) =>
      route.fulfill(json(remaining)),
    );
    await page.route("**/v1/organizations/g1", async (route) => {
      if (route.request().method() !== "DELETE") return route.fallback();
      deletes.push("g1");
      remaining = groups.filter((group) => group.id !== "g1");
      return route.fulfill({ status: 204 });
    });
  });

  test("muestra cada uno con su tipo y se filtra por tipo y por nombre", async ({
    page,
  }) => {
    await page.goto(`/portal/${NODE_ID}/groups`);

    await expect(
      page.getByRole("heading", { level: 1, name: "Grupos y ministerios" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Jóvenes/ })).toContainText(
      "Sábados 5 pm",
    );
    await expect(page.getByText("Mostrando 3 de 3")).toBeVisible();

    await page.getByRole("button", { name: "Ministerios 2" }).click();
    await expect(page.getByText("Jóvenes")).toHaveCount(0);
    await expect(page.getByText("Alabanza")).toBeVisible();

    await page.getByRole("button", { name: /Todos/ }).click();
    await page.getByRole("textbox", { name: "Buscar por nombre" }).fill("nin");
    await expect(page.getByText("Niños")).toBeVisible();
    await expect(page.getByText("Alabanza")).toHaveCount(0);
  });

  test("elimina uno después de confirmar", async ({ page }) => {
    await page.goto(`/portal/${NODE_ID}/groups`);

    await page.getByRole("button", { name: "Acciones para Jóvenes" }).click();
    await page.getByRole("menuitem", { name: "Eliminar" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("¿Eliminar Jóvenes?");
    await dialog.getByRole("button", { name: "Eliminar" }).click();

    await expect(page.getByText("Eliminado exitosamente")).toBeVisible();
    await expect(page.getByRole("link", { name: /Jóvenes/ })).toHaveCount(0);
    expect(deletes).toEqual(["g1"]);
  });

  test("abre uno desde su fila", async ({ page }) => {
    await page.route("**/v1/organizations/g2", (route) =>
      route.fulfill(
        json({
          id: "g2",
          name: "Alabanza",
          type: "MINISTRY",
          parentId: NODE_ID,
        }),
      ),
    );
    await page.route("**/v1/organizations/g2/childs**", (route) =>
      route.fulfill(json([])),
    );
    await page.goto(`/portal/${NODE_ID}/groups`);

    await page.getByRole("link", { name: /Alabanza/ }).click();

    await expect(page).toHaveURL(new RegExp(`/portal/g2/location$`));
  });
});
