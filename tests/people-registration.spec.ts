import { test, expect } from "./fixtures";
// import {faker } from "@faker-js/faker";

test.describe("Registro de persona", () => {
  const mLocId = "11111111-1111-1111-1111-111111111111";

  test("formulario de registro", async ({ page }) => {
    //Importación dinámica de faker
    const { faker } = await import("@faker-js/faker");

    //1. Mocks de red (Roles y post)
    await page.route("**/organizations/locations/*/roles", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            name: "Pastor",
            isPredefined: false,
          },
          {
            id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            name: "Líder de alabanza",
            isPredefined: false,
          },
          {
            id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
            name: "Ujier",
            isPredefined: true,
          },
        ]),
      });
    });

    await page.route("**/people", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({ message: "Persona registrada" }),
        });
      } else {
        await route.continue();
      }
    });

    //2. Navegación directa en el token ya cargado
    await page.goto(`/portal/${mLocId}/person/create`, {
      waitUntil: "networkidle",
    });

    //ESPERA CLAVE: Esperamos a que el campo "Nombre" sea visible.

    //3.Esperar que el formulario cargue
    const nombreInput = page.getByLabel(/Nombre/i);
    await nombreInput.waitFor({ state: "visible", timeout: 20000 });

    const personData = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      phone: "9" + faker.string.numeric(8),
    };

    //4. Llenar campos
    // await page.getByLabel("Nombre").fill(personData.firstName);
    await nombreInput.fill(personData.firstName);
    await page.getByLabel(/Apellido/i).fill(personData.lastName);
    await page.getByLabel(/Teléfono/i).pressSequentially(personData.phone);

    // const birthdateInput = page.getByLabel("Fecha de nacimiento");
    //5. Fecha de nacimiento
    const dateGroup = page.getByRole("group", { name: /Fecha de nacimiento/i });

    await dateGroup.getByRole("spinbutton", { name: /Day/i }).fill("01");
    await dateGroup.getByRole("spinbutton", { name: /Month/i }).fill("01");
    await dateGroup.getByRole("spinbutton", { name: /Year/i }).fill("1990");

    await dateGroup.getByRole("spinbutton", { name: /Year/i }).press("Tab");

    //6. Validación de Edad
    const ageValue = await page.getByLabel(/Edad/i).inputValue();
    expect(Number(ageValue)).toBeGreaterThan(0);

    //7. Bautismo y Roles
    await page.getByLabel("Si").check();
    // const rolesInput = page.getByLabel(/Escriba o seleccione/i);
    const rolesInput = page.getByRole("combobox", {
      name: /Escriba o seleccione/i,
    });
    //selección del primer rol
    await rolesInput.click();
    await page.getByRole("option", { name: /Líder/i }).click();

    await rolesInput.press("ArrowDown");

    //selección del segundo rol
    // await rolesInput.click();
    const opcionUjier = page.getByRole("option", { name: /Ujier/i });
    await opcionUjier.waitFor({ state: "visible" });
    await opcionUjier.click();
    // await page.getByRole("option", {  name: /Ujier/i }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByText("Líder de alabanza")).toBeVisible();
    await expect(page.getByText("Ujier")).toBeVisible();

    //8. Envío final
    await page.getByRole("button", { name: /Guardar/i }).click();
  });
});
