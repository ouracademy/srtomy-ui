import { expect, test } from "./fixtures";

test.describe("Editar Grupos y ministerios", () => {
  const nodeId = "11111111-1111-1111-1111-111111111111";
  const groupId = "33333333-3333-3333-3333-333333333333";

  test.beforeEach(async ({ page }) => {
    //1.
    await page.route(`**/organizations/${groupId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: groupId,
          name: "Grupo de Jóvenes",
          description: "Reunión de los sábados",
          type: "GROUP",
          parentId: nodeId,
        }),
      });
    });
    await page.route(`**/organizations/${groupId}/childs**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      }),
    );
    //2. Mocks de miembros y líderes
    await page.route(
      `**/organizations/locations/childs/${groupId}/members`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            LEADER: [
              {
                id: "11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
                firstName: "Juan",
                LastName: "Perez",
              },
            ],
            IS_PART_OF: [
              {
                id: "22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
                firstName: "Maria",
                lastName: "Garcia",
              },
            ],
          }),
        });
      },
    );
    //2b. Mock del guardado (PUT)
    await page.route(
      `**/organizations/locations/childs/${groupId}`,
      async (route) => {
        if (route.request().method() !== "PUT") return route.fallback();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: groupId, name: "Grupo de Jóvenes" }),
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
            {
              id: "33333333-cccc-cccc-cccc-cccccccccccc",
              firstName: "Pedro",
              lastName: "Picapiedra",
            },
          ],
        }),
      });
    });
  });

  test("Cargar los datos y editar", async ({ page }) => {
    // A group is a node of its own: its page edits it and lists its subgroups.
    await page.goto(`/portal/${groupId}/location`);

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

    //E. Guardar y verificar lo que se envía a la API
    const saved = page.waitForRequest(
      (request) =>
        request.method() === "PUT" &&
        request.url().endsWith(`/organizations/locations/childs/${groupId}`),
    );
    await page.getByRole("button", { name: /Guardar/i }).click();

    expect((await saved).postDataJSON()).toEqual({
      name: "Grupo de Jóvenes - Editado",
      description: "Reunión de los sábados",
      type: "GROUP",
      leaderIds: [
        "11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        "33333333-cccc-cccc-cccc-cccccccccccc",
      ],
      memberIds: ["22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb"],
      socialLinks: {},
      schedule: "",
      memberVisibility: "PUBLIC",
      showOrgChart: true,
    });
    await expect(page.getByText("Guardado exitosamente")).toBeVisible();
  });
});
