import { test, expect } from "./fixtures";
import { firstCalendarSlot } from "./calendar";

test.describe("Registro de eventos", () => {
  const nodeId = "11111111-1111-1111-1111-111111111111";
  test("abc", async ({ page }) => {
    const { faker } = await import("@faker-js/faker");

    //1 Mock para obtener locación
    await page.route(`**/organizations/${nodeId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: nodeId, address: "Calle Principal 123" }),
      });
    });

    //Mock para obtner ponentes
    await page.route("**/people*", async (route) => {
      await new Promise((f) => setTimeout(f, 500));

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          content: [
            {
              id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
              firstName: "Paul",
              lastName: "Ricoeur",
            },
            {
              id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
              firstName: "Hans",
              lastName: "Gadamer",
            },
          ],
        }),
      });
    });

    //Mock de post
    await page.route("**/events", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ message: "Guardar exitosamente" }),
        });
      }
    });

    //2 Navegación
    await page.goto(`/portal/${nodeId}/event`);

    //Esperamos que cargue un elemento
    await expect(
      page.getByRole("heading", { name: /eventos y cursos/i }),
    ).toBeVisible();

    //3 Abrir el formulario
    await firstCalendarSlot(page).click({ force: true });

    //4 Llenar el eventForm
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    //título
    await dialog
      .getByPlaceholder(/Agregar título/i)
      .fill(`Evento ${faker.company.name()}`);

    //Lugar
    await dialog.getByPlaceholder(/Agregar lugar/i).fill("Sede central");

    //Speakers con autocomplete
    const speakerInput = dialog.getByPlaceholder(/Agregar ponente/i);

    // await speakerInput.waitFor({ state: "visible"});
    await speakerInput.click();
    await speakerInput.fill("Paul");

    //5. Seleccionar Dropdown
    const option = page.getByRole("option", { name: /Ricoeur/i }).first();

    //Esperar y hacer clic
    await option.waitFor({ state: "visible", timeout: 5000 });
    await option.click();

    //Descripción
    await dialog
      .getByPlaceholder(/Agregar descripción/i)
      .fill(faker.lorem.paragraph());

    //5 Guardar
    const btnGuardar = dialog.getByRole("button", { name: /Guardar/i });
    await btnGuardar.click();

    //6 Verificación
    await expect(
      page.getByRole("alert").filter({ hasText: /Guardado exitosamente/i }),
    ).toBeVisible();
  });
});
