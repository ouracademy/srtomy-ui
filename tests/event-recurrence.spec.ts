import { test, expect } from "./fixtures";
import { firstCalendarSlot } from "./calendar";

test.describe("Eventos recurrentes", () => {
  const nodeId = "11111111-1111-1111-1111-111111111111";

  test("crea un evento que se repite cada 2 semanas, 5 veces", async ({
    page,
  }) => {
    await page.route(`**/organizations/${nodeId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: nodeId, address: "Calle Principal 123" }),
      });
    });
    await page.route("**/people*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ content: [] }),
      });
    });

    let posted: Record<string, unknown> | undefined;
    await page.route("**/events", async (route) => {
      if (route.request().method() === "POST") {
        posted = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify("22222222-2222-2222-2222-222222222222"),
        });
      }
    });

    await page.goto(`/portal/${nodeId}/event`);
    await expect(
      page.getByRole("heading", { name: /eventos y cursos/i }),
    ).toBeVisible();
    await firstCalendarSlot(page).click({ force: true });

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByPlaceholder(/Agregar título/i).fill("Servicio");

    await dialog.getByRole("combobox", { name: "Se repite" }).click();
    await page.getByRole("option", { name: "Personalizar…" }).click();
    const custom = page.getByRole("dialog", {
      name: "Recurrencia personalizada",
    });
    await custom.getByLabel("Repetir cada").fill("2");
    await custom.getByRole("radio", { name: "Después de" }).check();
    await custom.getByLabel("Repeticiones").fill("5");
    await custom.getByRole("button", { name: "Listo" }).click();
    await expect(custom).toBeHidden();
    await expect(
      dialog.getByRole("combobox", { name: "Se repite" }),
    ).toHaveText(/^Cada 2 semanas el .*, 5 veces$/);

    await dialog.getByRole("button", { name: /Guardar/i }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: /Guardado exitosamente/i }),
    ).toBeVisible();
    expect(posted?.recurrence).toMatchObject({
      frequency: "WEEKLY",
      interval: 2,
      endType: "COUNT",
      count: 5,
    });
    expect(posted?.timeZone).toEqual(expect.any(String));
  });

  test("un evento que no se repite no envía recurrencia", async ({ page }) => {
    await page.route(`**/organizations/${nodeId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: nodeId }),
      });
    });
    await page.route("**/people*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ content: [] }),
      });
    });
    let posted: Record<string, unknown> | undefined;
    await page.route("**/events", async (route) => {
      if (route.request().method() === "POST") {
        posted = route.request().postDataJSON();
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify("22222222-2222-2222-2222-222222222222"),
        });
      }
    });

    await page.goto(`/portal/${nodeId}/event`);
    await firstCalendarSlot(page).click({ force: true });
    const dialog = page.getByRole("dialog");
    await dialog.getByPlaceholder(/Agregar título/i).fill("Retiro");
    await dialog.getByRole("button", { name: /Guardar/i }).click();

    await expect(
      page.getByRole("alert").filter({ hasText: /Guardado exitosamente/i }),
    ).toBeVisible();
    expect(posted).toBeDefined();
    expect(posted?.recurrence).toBeUndefined();
  });
});
