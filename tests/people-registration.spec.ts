import { test, expect } from "./fixtures";
// import {faker } from "@faker-js/faker";

test.describe("Registro de persona", () => {
  const mLocId = "11111111-1111-1111-1111-111111111111";

  test("formulario de registro", async ({ page }) => {
    //Importación dinámica de faker
    const { faker } = await import("@faker-js/faker");

    //1. Mocks de red (cargos de la iglesia, creación de cargo y persona)
    await page.route("**/organizations/*/positions", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify({
            id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
            name: "Catequista",
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Pastor" },
          {
            id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            name: "Líder de grupo",
          },
          { id: "cccccccc-cccc-cccc-cccc-cccccccccccc", name: "Ujier" },
        ]),
      });
    });

    await page.route("**/people", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
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

    //7. Bautismo y cargos
    await page.getByRole("radio", { name: "Si" }).check();
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
    // A position the church does not have yet is created on save.
    await rolesInput.fill("Catequista");
    await rolesInput.press("Enter");
    await page.keyboard.press("Escape");
    await expect(page.getByText("Líder de grupo")).toBeVisible();
    await expect(page.getByText("Ujier")).toBeVisible();

    //8. Envío final
    const saved = page.waitForRequest(
      (request) =>
        request.method() === "POST" && request.url().endsWith("/v1/people"),
    );
    await page.getByRole("button", { name: /Guardar/i }).click();
    expect((await saved).postDataJSON().positionIds).toEqual([
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "cccccccc-cccc-cccc-cccc-cccccccccccc",
      "dddddddd-dddd-dddd-dddd-dddddddddddd",
    ]);
  });

  test("avisa si la persona ya existe o fue eliminada y permite reactivarla", async ({
    page,
  }) => {
    await page.route("**/v1/people/matches**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            id: "p1",
            fullName: "Ana Diaz",
            email: "ana@example.org",
            status: "ACTIVE",
          },
          {
            id: "p2",
            fullName: "Ana Diaz Rojas",
            status: "REMOVED",
            removedTime: "2026-03-04T10:00:00",
          },
        ]),
      }),
    );
    const restored = page.waitForRequest(
      (request) =>
        request.method() === "POST" &&
        request.url().includes("/v1/people/p2/restore"),
    );
    await page.route("**/v1/people/p2/restore**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify("p2"),
      }),
    );
    await page.route("**/v1/people/p2", (route) =>
      route.fulfill({ status: 404, body: "" }),
    );

    await page.goto(`/portal/${mLocId}/person/create`);
    await page.getByLabel(/Nombre/i).fill("Ana");
    await page.getByLabel(/Apellido/i).fill("Diaz");

    await expect(page.getByText("¿Es alguna de estas personas?")).toBeVisible();
    await expect(page.getByText(/Ya está registrada/)).toBeVisible();
    await expect(page.getByText(/Eliminada el 04\/03\/2026/)).toBeVisible();

    await page.getByRole("button", { name: "Reactivar" }).click();

    expect(
      new URL((await restored).url()).searchParams.get("organizationId"),
    ).toBe(mLocId);
    await expect(page).toHaveURL(new RegExp(`/person/p2$`));
  });

  test("agrega a un grupo a alguien que ya está en la iglesia, con su estado ahí", async ({
    page,
  }) => {
    await page.route("**/v1/organizations/*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ id: mLocId, name: "Jóvenes", type: "GROUP" }),
      }),
    );
    await page.route("**/v1/people/matches**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          { id: "p1", fullName: "Ana Diaz", status: "ACTIVE" },
        ]),
      }),
    );
    await page.route("**/v1/people?*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ content: [], totalElements: 0 }),
      }),
    );
    const added = page.waitForRequest(
      (request) =>
        request.method() === "PUT" &&
        request.url().endsWith(`/v1/people/p1/memberships/${mLocId}`),
    );
    await page.route("**/v1/people/p1/memberships/*", (route) =>
      route.fulfill({ status: 204, body: "" }),
    );

    await page.goto(`/portal/${mLocId}/person/create`);
    await page.getByLabel(/Nombre/i).fill("Ana");
    await page.getByLabel(/Apellido/i).fill("Diaz");
    await page.getByRole("button", { name: "Agregar aquí" }).click();

    // The state is the one of this group, whatever Ana is in the church.
    await page.getByRole("combobox", { name: "Estado en Jóvenes" }).click();
    await page.getByRole("option", { name: "Asistente" }).click();
    await page.getByRole("button", { name: "Agregar", exact: true }).click();

    expect((await added).postDataJSON()).toEqual({
      memberState: "MEMBERSHIP_IN_PROGRESS",
    });
    await expect(page).toHaveURL(new RegExp(`/portal/${mLocId}/person$`));
  });
});
