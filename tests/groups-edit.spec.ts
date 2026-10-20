import { expect, test } from "./fixtures";

test.describe("Editar Grupos y ministerios", () => {
  const locId = 12;
  const groupId = 13;

  test.beforeEach(async ({ page }) => {
    //1.
    await page.route(`**/organizations/${groupId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          name: "Grupo de Jóvenes",
          description: "Reunión de los sábados",
          type: "GROUP",
        }),
      });
    });
    //2. Mocks de miembros y líderes
    await page.route(
      `**/organizations/locations/childs/${groupId}/members`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            LEADER: [{ id: 1, firstName: "Juan", LastName: "Perez" }],
            IS_PART_OF: [{ id: 2, firstName: "Maria", lastName: "Garcia" }],
          }),
        });
      },
    );
    //3. Mock para el Autocomplete
    await page.route("**/people**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          content: [
            { id: 1, firstName: "Juan", lastName: "Perez" },
            { id: 2, firstName: "Maria", lastName: "Garcia" },
            { id: 3, firstName: "Pedro", lastName: "Picapiedra" },
          ],
        }),
      });
    });
  });

  test("Cargar los datos y editar", async ({ page }) => {
    // Navegar directamente a la URL
    await page.goto(`/portal/${locId}/location/groups/${groupId}`);

    //A. Verificar que los datos se cargaron correctamente
    const nameInput = page.getByRole("textbox", { name: /nombre/i });
    await expect(nameInput).toHaveValue("Grupo de Jóvenes");

    const description = page.getByRole("textbox", { name: /descripción/i });
    await expect(description).toHaveValue("Reunión de los sábados");

    //B. Verificar los Autocomplete
    await expect(page.getByText("Juan Perez")).toBeVisible();
    await expect(page.getByText("Maria Garcia")).toBeVisible();

    //C. Editar el nombre
    await nameInput.fill("Grupo de Jóvenes - Editado");

    //D. Agregar un nuevo Líder
    const leadersInput = page.getByLabel(
      /Escriba\/seleccione el lider o lideres/i,
    );
    await leadersInput.fill("Pedro");
    const optionPedro = page.getByRole("option", { name: "Pedro Picapiedra" });
    await expect(optionPedro).toBeVisible();
    await optionPedro.click();

    //E. Guardar
    await page.getByRole("button", { name: /Guardar/i }).click();
  });
});
