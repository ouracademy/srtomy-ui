import { test, expect, levels } from "./fixtures";
import { CHURCH_ID, NODE_ID } from "./e2e-env";

const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

test.describe("Accesos", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**/organizations/${NODE_ID}`, (route) =>
      route.fulfill(
        json({ id: NODE_ID, name: "Sede Central", type: "LOCATION" }),
      ),
    );
    await page.route(`**/organizations/${CHURCH_ID}`, (route) =>
      route.fulfill(
        json({ id: CHURCH_ID, name: "Iglesia E2E", type: "CHURCH" }),
      ),
    );
    await page.route("**/organizations/*/roles", (route) =>
      route.fulfill(json(levels)),
    );
  });

  test("muestra quién tiene acceso y de dónde viene, sin otorgar roles sueltos", async ({
    page,
  }) => {
    await page.route(`**/organizations/${NODE_ID}/access`, (route) =>
      route.fulfill(
        json([
          {
            bindingId: "b1",
            userId: "u1",
            email: "ana@example.com",
            roleId: "level-owner",
            roleName: "Propietario",
            organizationId: CHURCH_ID,
            organizationName: "Iglesia E2E",
            inherited: true,
            source: "DIRECT",
          },
          {
            userId: "u2",
            email: "luis@example.com",
            roleId: "level-leader",
            roleName: "Líder",
            organizationId: NODE_ID,
            organizationName: "Sede Central",
            inherited: false,
            source: "POSITION",
            positionName: "Pastor",
          },
        ]),
      ),
    );

    await page.goto(`/portal/${NODE_ID}/access`);

    await expect(
      page.getByRole("heading", { name: "Personas con acceso" }),
    ).toBeVisible();
    await expect(page.getByText("Cargo Pastor", { exact: true })).toBeVisible();
    await expect(page.getByText("Propietario de la iglesia")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Otorgar acceso" }),
    ).toHaveCount(0);
    await page
      .getByRole("link", { name: "Cargos y niveles de acceso" })
      .click();
    await expect(page).toHaveURL(new RegExp(`/portal/${NODE_ID}/positions$`));
  });

  test("agrega un Propietario desde la iglesia", async ({ page }) => {
    let added: unknown;
    await page.route(`**/organizations/${CHURCH_ID}/access`, (route) =>
      route.fulfill(json([])),
    );
    await page.route(`**/organizations/${CHURCH_ID}/owners`, async (route) => {
      added = route.request().postDataJSON();
      await route.fulfill({ status: 201 });
    });

    await page.goto(`/portal/${CHURCH_ID}/access`);
    await page
      .getByRole("textbox", { name: "Correo del nuevo Propietario" })
      .fill("nuevo@example.com");
    await page.getByRole("button", { name: "Agregar Propietario" }).click();

    await expect(page.getByText("Propietario agregado")).toBeVisible();
    expect(added).toEqual({ email: "nuevo@example.com" });
  });

  test("cambia el nivel de acceso de un cargo y avisa a cuántas personas afecta", async ({
    page,
  }) => {
    let changed: unknown;
    await page.route("**/v1/positions/p-pastor/access", async (route) => {
      changed = route.request().postDataJSON() ?? route.request().postData();
      await route.fulfill(
        json({ id: "p-pastor", name: "Pastor", accessRoleId: "level-collab" }),
      );
    });

    await page.goto(`/portal/${NODE_ID}/positions`);
    await page
      .getByRole("combobox", { name: "Nivel de acceso de Pastor" })
      .click();
    await page.getByRole("option", { name: "Colaborador" }).click();

    await expect(
      page.getByText(/1 persona tiene el cargo Pastor/),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cambiar nivel" }).click();

    await expect(page.getByText("Nivel de acceso actualizado")).toBeVisible();
    expect(changed).toEqual({ accessRoleId: "level-collab" });
  });

  test("crea un nivel personalizado a partir de uno predefinido", async ({
    page,
  }) => {
    let created: unknown;
    await page.route("**/v1/iam/permissions", (route) =>
      route.fulfill(
        json([{ resource: "org", permissions: ["org.read", "org.update"] }]),
      ),
    );
    await page.route(`**/organizations/${NODE_ID}/roles`, async (route) => {
      if (route.request().method() === "POST") {
        created = route.request().postDataJSON();
        await route.fulfill(json({ id: "role-new", name: "Mío" }, 201));
        return;
      }
      await route.fulfill(json(levels));
    });

    await page.goto(`/portal/${NODE_ID}/positions/levels`);
    await page.getByRole("button", { name: "Nuevo nivel" }).click();
    await page.getByRole("combobox", { name: "Crear a partir de" }).click();
    await page.getByRole("option", { name: "Colaborador" }).click();
    await page
      .getByRole("checkbox", {
        name: /^Editar nombre, dirección, teléfono y redes de la iglesia, sede, grupo o ministerio$/,
      })
      .check();
    await page.getByRole("textbox", { name: "Nombre" }).fill("Mío");
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByText("Nivel creado")).toBeVisible();
    expect(created).toEqual({
      name: "Mío",
      description: "",
      permissions: ["org.read", "org.update"],
    });
  });

  test("sin iam.read no aparece Accesos en el menú", async ({ page }) => {
    await page.route("**/v1/me/permissions**", (route) =>
      route.fulfill(json(["org.read", "members.read"])),
    );
    await page.route("**/organizations/*/childs**", (route) =>
      route.fulfill(json([])),
    );

    await page.goto(`/portal/${NODE_ID}/location`);

    const menu = page.getByRole("list", { name: "Menú principal" });
    await expect(menu.getByText("Personas", { exact: true })).toBeVisible();
    await expect(menu.getByText("Accesos", { exact: true })).toHaveCount(0);
  });
});
