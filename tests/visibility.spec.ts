import { test, expect } from "./fixtures";
import { CHURCH_ID, NODE_ID } from "./e2e-env";

const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

test.describe("Visibilidad", () => {
  test("elige quién ve la lista de personas y el horario de la sede", async ({
    page,
  }) => {
    await page.route(`**/organizations/${NODE_ID}`, async (route) => {
      if (route.request().method() === "PUT") {
        await route.fulfill(json({ id: NODE_ID, name: "Sede Central" }));
        return;
      }
      await route.fulfill(
        json({
          id: NODE_ID,
          name: "Sede Central",
          type: "LOCATION",
          memberVisibility: "PUBLIC",
          showOrgChart: true,
          slug: "abc123def456ghij",
        }),
      );
    });
    await page.route(`**/organizations/${NODE_ID}/childs**`, (route) =>
      route.fulfill(json([])),
    );

    await page.goto(`/portal/${NODE_ID}/location`);
    await page.getByText("Horario y visibilidad").click();
    await expect(
      page.getByRole("link", { name: /\/g\/abc123def456ghij/ }),
    ).toBeVisible();
    await page.getByLabel("Horario de reunión").fill("Domingos 10 am");
    await page.getByLabel("Solo líderes").check();
    await page.getByLabel(/Mostrar el organigrama/).uncheck();

    const saved = page.waitForRequest(
      (request) =>
        request.method() === "PUT" &&
        request.url().endsWith(`/organizations/${NODE_ID}`),
    );
    await page.getByRole("button", { name: /Guardar/i }).click();

    expect((await saved).postDataJSON()).toMatchObject({
      schedule: "Domingos 10 am",
      memberVisibility: "LEADERS",
      showOrgChart: false,
    });
  });

  test("el directorio muestra los nodos y esconde la lista que no se puede ver", async ({
    page,
  }) => {
    await page.route(`**/organizations/${NODE_ID}`, (route) =>
      route.fulfill(
        json({ id: NODE_ID, name: "Sede Central", type: "LOCATION" }),
      ),
    );
    await page.route(`**/v1/organizations/${CHURCH_ID}/directory`, (route) =>
      route.fulfill(
        json([
          { id: CHURCH_ID, name: "Iglesia E2E", type: "CHURCH", leaders: [] },
          {
            id: NODE_ID,
            name: "Sede Central",
            type: "LOCATION",
            parentId: CHURCH_ID,
            schedule: "Domingos 10 am",
            leaders: ["Ana Díaz"],
            memberVisibility: "MEMBERS",
          },
          {
            id: "g-reservado",
            name: "Consejo",
            type: "GROUP",
            parentId: NODE_ID,
            leaders: [],
            memberVisibility: "LEADERS",
          },
        ]),
      ),
    );
    await page.route("**/v1/organizations/*/directory-entry", async (route) => {
      const hidden = route.request().url().includes("g-reservado");
      await route.fulfill(
        json({
          membersVisible: !hidden,
          members: hidden ? [] : ["Luis Paz", "Eva Sol"],
          children: [],
        }),
      );
    });

    await page.goto(`/portal/${NODE_ID}/directory`);

    await expect(
      page.getByRole("heading", { name: "Directorio de Iglesia E2E" }),
    ).toBeVisible();
    await expect(page.getByText("Horario: Domingos 10 am")).toBeVisible();
    await expect(page.getByText("Líder: Ana Díaz")).toBeVisible();

    await page
      .getByRole("button", { name: "Ver personas de Sede Central" })
      .click();
    await expect(page.getByText("Luis Paz")).toBeVisible();

    await page.getByRole("button", { name: "Ver personas de Consejo" }).click();
    await expect(page.getByText(/no sea visible para usted/)).toBeVisible();
  });

  test("la página pública se abre con el enlace y navega por el organigrama", async ({
    page,
  }) => {
    await page.route("**/v1/public/organizations/iglesia-slug", (route) =>
      route.fulfill(
        json({
          name: "Iglesia E2E",
          type: "CHURCH",
          schedule: "Domingos 10 am",
          address: "Av. 1",
          leaders: [],
          positions: [{ position: "Pastor", people: ["Pedro Pastor"] }],
          orgChart: {
            name: "Iglesia E2E",
            type: "CHURCH",
            slug: "iglesia-slug",
            leaders: [],
            children: [
              {
                name: "Sede Norte",
                type: "LOCATION",
                slug: "norte-slug",
                leaders: ["Lía Líder"],
                children: [],
              },
            ],
          },
        }),
      ),
    );
    await page.route("**/v1/public/organizations/norte-slug", (route) =>
      route.fulfill(
        json({
          name: "Sede Norte",
          type: "LOCATION",
          leaders: ["Lía Líder"],
          positions: [],
        }),
      ),
    );

    await page.goto("/g/iglesia-slug");
    await expect(
      page.getByRole("heading", { name: "Iglesia E2E", level: 1 }),
    ).toBeVisible();
    await expect(page.getByText("Pedro Pastor")).toBeVisible();

    await page.getByRole("link", { name: "Sede Norte" }).click();

    await expect(page).toHaveURL(/\/g\/norte-slug$/);
    await expect(
      page.getByRole("heading", { name: "Sede Norte", level: 1 }),
    ).toBeVisible();
  });

  test("un nodo que no es público responde que no se encontró", async ({
    page,
  }) => {
    await page.route("**/v1/public/organizations/privado", (route) =>
      route.fulfill(json({ title: "Not Found" }, 404)),
    );

    await page.goto("/g/privado");

    await expect(page.getByText(/No encontrado/i)).toBeVisible();
  });
});
