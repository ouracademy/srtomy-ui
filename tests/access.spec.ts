import { test, expect } from "./fixtures";
import { CHURCH_ID, NODE_ID } from "./e2e-env";

const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

const roles = [
  {
    id: "role-leader",
    name: "Líder",
    permissions: ["org.read"],
    predefined: true,
  },
];

test.describe("Cargos y accesos", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**/organizations/${NODE_ID}`, (route) =>
      route.fulfill(
        json({ id: NODE_ID, name: "Sede Central", type: "LOCATION" }),
      ),
    );
    await page.route("**/organizations/*/roles", (route) =>
      route.fulfill(json(roles)),
    );
    await page.route("**/organizations/*/positions**", (route) =>
      route.fulfill(json([])),
    );
    await page.route("**/positions/suggestions", (route) =>
      route.fulfill(json([])),
    );
  });

  test("muestra accesos heredados y directos, y otorga un rol", async ({
    page,
  }) => {
    let granted: unknown;
    await page.route(`**/organizations/${NODE_ID}/access`, async (route) => {
      if (route.request().method() === "POST") {
        granted = route.request().postDataJSON();
        await route.fulfill({ status: 201 });
        return;
      }
      await route.fulfill(
        json([
          {
            bindingId: "b1",
            email: "ana@example.com",
            roleName: "Propietario",
            organizationId: CHURCH_ID,
            organizationName: "Iglesia E2E",
            inherited: true,
          },
          {
            bindingId: "b2",
            email: "luis@example.com",
            roleName: "Líder",
            organizationId: NODE_ID,
            organizationName: "Sede Central",
            inherited: false,
          },
        ]),
      );
    });

    await page.goto(`/portal/${NODE_ID}/positions`);
    await page.getByRole("tab", { name: "Accesos" }).click();

    await expect(page.getByText("Heredado de Iglesia E2E")).toBeVisible();
    await expect(page.getByText("Directo")).toBeVisible();

    await page.getByLabel("Correo").fill("nuevo@example.com");
    await page.getByRole("combobox", { name: "Rol" }).click();
    await page.getByRole("option", { name: "Líder" }).click();
    await page.getByRole("button", { name: "Otorgar acceso" }).click();

    await expect(page.getByText("Acceso otorgado")).toBeVisible();
    expect(granted).toEqual({
      email: "nuevo@example.com",
      roleId: "role-leader",
    });
  });

  test("crea un rol personalizado a partir de uno predefinido", async ({
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
      await route.fulfill(json(roles));
    });

    await page.goto(`/portal/${NODE_ID}/positions`);
    await page.getByRole("tab", { name: "Roles" }).click();
    await page.getByRole("button", { name: "Nuevo rol" }).click();
    await page.getByRole("combobox", { name: "Crear a partir de" }).click();
    await page.getByRole("option", { name: "Líder" }).click();
    await page.getByRole("checkbox", { name: "Editar datos" }).check();
    await page.getByRole("textbox", { name: "Nombre" }).fill("Mío");
    await page.getByRole("button", { name: "Guardar" }).click();

    await expect(page.getByText("Rol creado")).toBeVisible();
    expect(created).toEqual({
      name: "Mío",
      description: "",
      permissions: ["org.read", "org.update"],
    });
  });

  test("sin iam.read solo se ve la pestaña Cargos", async ({ page }) => {
    await page.route("**/v1/me/permissions**", (route) =>
      route.fulfill(json(["org.read", "members.read"])),
    );

    await page.goto(`/portal/${NODE_ID}/positions`);

    await expect(page.getByRole("tab", { name: "Cargos" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Accesos" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Roles" })).toHaveCount(0);
  });
});
