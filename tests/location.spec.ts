import { test, expect } from "./fixtures";

test.describe("Editar Sede", () => {
  const locId = 12;

  //1. Se ejecutan antes de cada test
  test.beforeEach(async ({ page }) => {
    //Datos de la sede
    await page.route(`**/organizations/${locId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: locId,
          name: "Sede Central Antigua",
          address: "Av. Siempre Viva 123",
          phoneNumber: "987654321",
        }),
      });
    });

    //Datos de roles
    await page.route(
      `**/organizations/locations/${locId}/roles`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: 1, name: "PASTOR", isPredefined: true },
            { id: 2, name: "VOLUNTARIO", isPredefined: false },
          ]),
        });
      },
    );

    //Guardado
    await page.route(`**/organizations/locations/${locId}`, async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Guardado exitosamente" }),
        });
      }
    });
  });

  test("Editar sede y roles", async ({ page }) => {
    const { faker } = await import("@faker-js/faker");
    //2. Navegación
    await page.goto(`/portal/${locId}/location`);
    //3. Verificación
    await expect(page.getByText("Datos generales de la sede")).toBeVisible();
    //getByRole para evitar ambigüedad
    const nameInput = page.getByRole("textbox", {
      name: "Nombre",
      exact: true,
    });
    const addressInput = page.getByRole("textbox", {
      name: "Dirección",
      exact: true,
    });

    await expect(nameInput).toHaveValue("Sede Central Antigua");
    await expect(addressInput).toHaveValue("Av. Siempre Viva 123");

    //4. Interacción con el autocomplete
    const nuevoNombreSede = `Sede ${faker.location.city()}`;
    const nuevoRol = "Lider de jovenes";

    await nameInput.fill(nuevoNombreSede);
    //Añadir rol
    const rolesInput = page.getByPlaceholder(/Si desea añada otros roles/i);
    await rolesInput.fill(nuevoRol);
    await page.keyboard.press("Enter");

    //Verificar
    await expect(page.getByRole("button", { name: nuevoRol })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pastor" })).toBeVisible();

    //5. Guardar
    await page.getByRole("button", { name: /Guardar/i }).click();

    //6. Snackbar
    await expect(page.getByText(/Guardado exitosamente/i)).toBeVisible();
  });

  test("error de validación", async ({ page }) => {
    await page.goto(`/portal/${locId}/location`);
    //Limpiar cambio de nombre
    const nameInput = page.getByRole("textbox", {
      name: "Nombre",
      exact: true,
    });
    await expect(nameInput).toHaveValue("Sede Central Antigua");
    await nameInput.fill("");

    //Guardar
    await page.getByRole("button", { name: /Guardar/i }).click();

    //Verificar
    await expect(
      page.getByText(/Por favor ingrese el nombre de la sede/i),
    ).toBeVisible();
  });
});
