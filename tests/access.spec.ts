import { test, expect } from "./fixtures";
import { CHURCH_ID, NODE_ID } from "./e2e-env";

const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

test.describe("Cargos y accesos", () => {
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
  });

  test("abre un cargo y ve sus permisos por módulo y sus personas", async ({
    page,
  }) => {
    await page.goto(`/portal/${NODE_ID}/positions`);

    await expect(
      page.getByRole("heading", { name: "Cargos y accesos" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Abrir Pastor" }).click();

    await expect(
      page.getByRole("checkbox", { name: "Crear y editar personas" }),
    ).toBeChecked();
    await expect(
      page.getByText("Ana Díaz · Sede Central · ana@example.com"),
    ).toBeVisible();
  });

  test("cambia los permisos de un cargo y avisa a quién afecta", async ({
    page,
  }) => {
    let changed: unknown;
    await page.route("**/v1/positions/p-pastor/access", async (route) => {
      changed = route.request().postDataJSON();
      await route.fulfill(
        json({ id: "p-pastor", name: "Pastor", permissions: [] }),
      );
    });

    await page.goto(`/portal/${NODE_ID}/positions`);
    await page.getByRole("button", { name: "Abrir Pastor" }).click();
    await page.getByRole("checkbox", { name: "Ver eventos y cursos" }).check();
    await page.getByRole("button", { name: "Guardar permisos" }).click();

    await expect(
      page.getByText(/1 persona con cuenta tiene el cargo Pastor/),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cambiar permisos" }).click();

    await expect(page.getByText("Permisos actualizados")).toBeVisible();
    expect(changed).toEqual({
      permissions: ["org.read", "members.write", "events.read"],
    });
  });

  test("crea un cargo a partir de uno sugerido", async ({ page }) => {
    let created: unknown;
    await page.route(`**/organizations/${NODE_ID}/positions`, async (route) => {
      if (route.request().method() === "POST") {
        created = route.request().postDataJSON();
        await route.fulfill(
          json({ id: "p-new", name: "Diácono", permissions: [] }, 201),
        );
        return;
      }
      await route.fallback();
    });

    await page.goto(`/portal/${NODE_ID}/positions`);
    await page.getByRole("combobox", { name: "Nuevo cargo" }).fill("Diácono");
    await page.getByRole("button", { name: "Agregar" }).click();

    await expect(page.getByText("Cargo agregado")).toBeVisible();
    expect(created).toEqual({
      name: "Diácono",
      permissions: ["org.read", "events.write"],
    });
  });

  test("muestra quién tiene acceso y de dónde viene", async ({ page }) => {
    await page.route(`**/organizations/${NODE_ID}/access`, (route) =>
      route.fulfill(
        json([
          {
            bindingId: "b1",
            userId: "u1",
            email: "ana@example.com",
            roleId: "role-owner",
            roleName: "Propietario",
            organizationId: CHURCH_ID,
            organizationName: "Iglesia E2E",
            inherited: true,
            source: "DIRECT",
            permissionCount: 12,
          },
          {
            userId: "u2",
            email: "luis@example.com",
            organizationId: NODE_ID,
            organizationName: "Sede Central",
            inherited: false,
            source: "POSITION",
            positionName: "Pastor",
            permissionCount: 2,
          },
        ]),
      ),
    );

    await page.goto(`/portal/${NODE_ID}/positions`);
    await page.getByRole("tab", { name: "Personas con acceso" }).click();

    await expect(page.getByText("Cargo Pastor", { exact: true })).toBeVisible();
    await expect(page.getByText("2 permisos")).toBeVisible();
    await expect(page.getByText("Propietario de la iglesia")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Otorgar acceso" }),
    ).toHaveCount(0);
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

    await page.goto(`/portal/${CHURCH_ID}/positions`);
    await page.getByRole("tab", { name: "Propietarios" }).click();
    await page
      .getByRole("textbox", { name: "Correo del nuevo Propietario" })
      .fill("nuevo@example.com");
    await page.getByRole("button", { name: "Agregar Propietario" }).click();

    await expect(page.getByText("Propietario agregado")).toBeVisible();
    expect(added).toEqual({ email: "nuevo@example.com" });
  });

  test("sin iam.read solo hay cargos, y el menú ya no tiene Accesos", async ({
    page,
  }) => {
    await page.route("**/v1/me/permissions**", (route) =>
      route.fulfill(json(["org.read", "members.read"])),
    );

    await page.goto(`/portal/${NODE_ID}/positions`);

    await expect(page.getByRole("tab", { name: "Cargos" })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Personas con acceso" }),
    ).toHaveCount(0);
    const menu = page.getByRole("list", { name: "Menú principal" });
    await expect(
      menu.getByText("Cargos y accesos", { exact: true }),
    ).toBeVisible();
    await expect(menu.getByText("Accesos", { exact: true })).toHaveCount(0);
  });
});
