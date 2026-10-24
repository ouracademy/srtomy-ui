import { test, expect } from "./fixtures";

test.describe("Grupos y Ministerios", () => {
  const nodeId = "11111111-1111-1111-1111-111111111111";

  //1. Mocks
  test.beforeEach(async ({ page }) => {
    //
    await page.route(`**/organizations/${nodeId}/childs**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
            name: "Grupo de oración",
            type: "GROUP",
          },
        ]),
      });
    });

    await page.route("**/people**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          content: [
            {
              id: "11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              firstName: "Juan",
              lastName: "Perez",
            },
            {
              id: "22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              firstName: "Maria",
              lastName: "Garcia",
            },
          ],
        }),
      });
    });

    //Mock creación del grupo (POST)
    await page.route("**/organizations/locations/childs", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ message: "Guardado exitosamente" }),
        });
      }
    });
  });

  test("Crear un grupo exitosamente", async ({ page }) => {
    //1. Navegar a la página de creación
    await page.goto(`/portal/${nodeId}/location/groups/create`);

    //2. Verificar el título del formulario
    await expect(
      page.getByText("Datos generales del Grupo / Ministerio"),
    ).toBeVisible();

    //3. Llenar nombre y descripción
    await page
      .getByRole("textbox", { name: /nombre/i })
      .fill("Ministerio de Alabanza");
    await page
      .getByRole("textbox", { name: /descripción/i })
      .fill("Encargados de la música");

    //4. Seleccionar el tipo (button)
    await page.getByLabel(/ministerio/i).check();

    //5. Llenar líderes (Autocomplete)
    const leadersInput = page.getByLabel(
      /Escriba\/seleccione el lider o lideres/i,
    );
    await leadersInput.fill("Juan");
    const optionJuan = page.getByRole("option", { name: "Juan Perez" });
    await expect(optionJuan).toBeVisible();
    await optionJuan.click();

    //6. Llenar miembros (Autocomplete)
    const membersInput = page.getByLabel(/Escriba\/seleccione los miembros/i);
    await membersInput.fill("Maria");
    const optionMaria = page.getByRole("option", { name: "Maria Garcia" });
    await expect(optionMaria).toBeVisible();
    await optionMaria.click();

    // await page.getByText("Maria Garcia").click();

    //7. Guardar
    await page.getByRole("button", { name: /Guardar/i }).click();

    //8. Verificaciones finales
    await expect(page.getByText(/guardado exitosamente/i)).toBeVisible();

    //
    await expect(page).toHaveURL(new RegExp(`/portal/${nodeId}/location`));
  });

  test("error de validación", async ({ page }) => {
    await page.goto(`/portal/${nodeId}/location/groups/create`);

    //1. Intentar guardar sin llenar
    await page.getByRole("button", { name: /Guardar/i }).click();

    //2. Verificar mensajes de error de Zod
    await expect(
      page.getByText(/Por favor ingrese el nombre del Grupo o ministerio/i),
    ).toBeVisible();
  });
});
