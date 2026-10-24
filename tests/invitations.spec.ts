import { test, expect } from "./fixtures";
import { NODE_ID } from "./e2e-env";

const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

test.describe("Invitaciones", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(`**/organizations/${NODE_ID}`, (route) =>
      route.fulfill(
        json({ id: NODE_ID, name: "Sede Central", type: "LOCATION" }),
      ),
    );
  });

  test("invita por correo con un cargo y ve las pendientes", async ({
    page,
  }) => {
    let sent: unknown;
    let pending: unknown[] = [];
    await page.route(
      `**/v1/organizations/${NODE_ID}/invitations`,
      async (route) => {
        if (route.request().method() === "POST") {
          sent = route.request().postDataJSON();
          pending = [
            {
              id: "inv-1",
              email: "beto@example.com",
              personName: "Beto Pérez",
              positionName: "Pastor",
              status: "PENDING",
              expiresAt: "2030-01-15T10:00:00",
            },
          ];
          await route.fulfill(
            json({ invitation: pending[0], emailSent: true }, 201),
          );
          return;
        }
        await route.fulfill(json(pending));
      },
    );

    await page.goto(`/portal/${NODE_ID}/positions`);
    await page.getByRole("tab", { name: "Invitaciones" }).click();
    await page.getByLabel("Correo").fill("beto@example.com");
    await page.getByLabel("Nombre").fill("Beto");
    await page.getByLabel("Apellido").fill("Pérez");
    await page.getByRole("combobox", { name: "Cargo" }).click();
    await page.getByRole("option", { name: "Pastor" }).click();
    await page.getByRole("button", { name: "Invitar" }).click();

    await expect(page.getByText("Invitación enviada")).toBeVisible();
    expect(sent).toEqual({
      email: "beto@example.com",
      firstName: "Beto",
      lastName: "Pérez",
      positionId: "p-pastor",
    });
    await expect(page.getByRole("cell", { name: "Beto Pérez" })).toBeVisible();
  });

  test("muestra por qué la API rechazó la invitación", async ({ page }) => {
    await page.route(
      `**/v1/organizations/${NODE_ID}/invitations`,
      async (route) => {
        if (route.request().method() === "POST") {
          await route.fulfill(
            json({ detail: "No puedes dar permisos que no tienes" }, 403),
          );
          return;
        }
        await route.fulfill(json([]));
      },
    );

    await page.goto(`/portal/${NODE_ID}/positions`);
    await page.getByRole("tab", { name: "Invitaciones" }).click();
    await page.getByLabel("Correo").fill("beto@example.com");
    await page.getByLabel("Nombre").fill("Beto");
    await page.getByLabel("Apellido").fill("Pérez");
    await page.getByRole("button", { name: "Invitar" }).click();

    await expect(
      page.getByText("No puedes dar permisos que no tienes"),
    ).toBeVisible();
    await expect(page.getByLabel("Correo")).toHaveValue("beto@example.com");
  });

  test("quien abre el enlace acepta la invitación y entra al nodo", async ({
    page,
  }) => {
    await page.route("**/v1/public/invitations/tok-123", (route) =>
      route.fulfill(
        json({
          email: "e2e@example.com",
          organizationName: "Sede Central",
          positionName: "Ujier",
          status: "PENDING",
        }),
      ),
    );
    let accepted = false;
    await page.route("**/v1/invitations/tok-123/accept", async (route) => {
      accepted = true;
      await route.fulfill(
        json({ organizationId: NODE_ID, churchId: "church", personId: "p1" }),
      );
    });

    await page.goto("/invitacion/tok-123");
    await expect(
      page.getByRole("heading", { name: "Lo invitaron a Sede Central" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Aceptar invitación" }).click();

    await expect(page).toHaveURL(new RegExp(`/portal/${NODE_ID}`));
    expect(accepted).toBe(true);
  });

  test("avisa cuando la invitación es para otro correo", async ({ page }) => {
    await page.route("**/v1/public/invitations/tok-9", (route) =>
      route.fulfill(
        json({
          email: "otro@example.com",
          organizationName: "Sede Central",
          status: "PENDING",
        }),
      ),
    );
    await page.route("**/v1/invitations/tok-9/accept", (route) =>
      route.fulfill(
        json({ detail: "Esta invitación es para otro@example.com" }, 403),
      ),
    );

    await page.goto("/invitacion/tok-9");
    await page.getByRole("button", { name: "Aceptar invitación" }).click();

    await expect(
      page.getByText("Esta invitación es para otro@example.com"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Usar otra cuenta" }),
    ).toBeVisible();
  });
});
