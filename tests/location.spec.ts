import { test, expect } from "./fixtures";
import { NODE_ID } from "./e2e-env";

test.describe("Editar Sede", () => {
  const nodeId = NODE_ID;

  test.beforeEach(async ({ page }) => {
    await page.route(`**/organizations/${nodeId}`, async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: nodeId, name: "Guardada" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: nodeId,
          name: "Sede Central Antigua",
          address: "Av. Siempre Viva 123",
          phoneNumber: "987654321",
          type: "LOCATION",
        }),
      });
    });
    await page.route(`**/organizations/${nodeId}/childs**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );
  });

  test("Editar sede y sus redes sociales", async ({ page }) => {
    await page.goto(`/portal/${nodeId}/location`);
    await expect(page.getByText("Datos de la sede")).toBeVisible();

    const nameInput = page.getByRole("textbox", {
      name: "Nombre",
      exact: true,
    });
    await expect(nameInput).toHaveValue("Sede Central Antigua");
    await expect(
      page.getByRole("textbox", { name: "Dirección", exact: true }),
    ).toHaveValue("Av. Siempre Viva 123");

    await nameInput.fill("Sede Norte");
    await page.getByText(/Otras opciones/).click();
    await page
      .getByRole("textbox", { name: "Facebook" })
      .fill("https://facebook.com/sedenorte");

    const saved = page.waitForRequest(
      (request) =>
        request.method() === "PUT" &&
        request.url().endsWith(`/organizations/${nodeId}`),
    );
    await page.getByRole("button", { name: /Guardar/i }).click();

    expect((await saved).postDataJSON()).toMatchObject({
      name: "Sede Norte",
      socialLinks: { facebookUrl: "https://facebook.com/sedenorte" },
    });
    await expect(page.getByText(/Guardado exitosamente/i)).toBeVisible();
  });

  test("error de validación", async ({ page }) => {
    await page.goto(`/portal/${nodeId}/location`);
    const nameInput = page.getByRole("textbox", {
      name: "Nombre",
      exact: true,
    });
    await expect(nameInput).toHaveValue("Sede Central Antigua");
    await nameInput.fill("");

    await page.getByRole("button", { name: /Guardar/i }).click();

    await expect(page.getByText(/Por favor ingrese el nombre/i)).toBeVisible();
  });

  test("sin permiso de edición no se muestra Guardar", async ({ page }) => {
    await page.route("**/v1/me/permissions**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(["org.read", "events.read"]),
      }),
    );

    await page.goto(`/portal/${nodeId}/location`);

    await expect(
      page.getByRole("textbox", { name: "Nombre", exact: true }),
    ).toHaveValue("Sede Central Antigua");
    await expect(page.getByRole("button", { name: /Guardar/i })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Personas" })).toHaveCount(0);
  });
});
