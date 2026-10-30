import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";
import { CHURCH_ID, NODE_ID } from "./e2e-env";

const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

// A plain member: belongs to the location, has no position.
async function asMember(page: import("@playwright/test").Page) {
  await page.route("**/v1/me/permissions**", (route) =>
    route.fulfill(json(["org.read", "events.read"])),
  );
  await page.route("**/v1/me/nodes", (route) =>
    route.fulfill(
      json([
        {
          id: NODE_ID,
          name: "Sede Central",
          type: "LOCATION",
          churchId: CHURCH_ID,
          churchName: "Iglesia E2E",
          positions: [],
        },
      ]),
    ),
  );
  await page.route("**/v1/me/events", (route) =>
    route.fulfill(
      json([
        {
          title: "Curso de discipulado",
          start: "2030-01-05T15:00:00Z",
          isACourse: true,
          organizationName: "Sede Central",
          registered: true,
          attended: false,
          slug: "curso",
          registrationId: "r1",
          ticketName: "General",
          registrationStatus: "CONFIRMED",
          cancelCode: "cancelar-1",
          ticketCode: "ticket-1",
        },
        {
          title: "Culto dominical",
          start: "2029-12-29T15:00:00Z",
          isACourse: false,
          organizationName: "Sede Central",
          registered: false,
          attended: true,
          slug: "culto",
        },
      ]),
    ),
  );
  await page.route("**/v1/me/shared-events", (route) =>
    route.fulfill(
      json([
        {
          title: "Retiro",
          start: "2030-02-02T15:00:00Z",
          isACourse: false,
          organizationName: "Jóvenes",
          role: "VIEWER",
          slug: "retiro",
        },
      ]),
    ),
  );
  await page.route("**/v1/me/invitations", (route) =>
    route.fulfill(
      json([
        {
          id: "inv-1",
          organizationName: "Jóvenes",
          positionName: "Ujier",
          needsName: false,
        },
      ]),
    ),
  );
}

test.describe("Mi espacio", () => {
  test("un miembro sin cargo aterriza en Mi espacio y ve sus secciones", async ({
    page,
  }) => {
    await asMember(page);

    await page.goto("/portal");

    await expect(page).toHaveURL(/\/portal\/me$/);
    await expect(
      page.getByRole("heading", { name: "Mi espacio" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Mis eventos y cursos" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Curso de discipulado" }),
    ).toHaveAttribute("href", "/e/curso");
    await expect(
      page.getByRole("heading", { name: "Tengo lugar" }),
    ).toBeVisible();
    await expect(page.getByText("Confirmado")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Asistí" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Culto dominical" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Mis grupos y ministerios" }),
    ).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Mis grupos y ministerios" }),
    ).toContainText("Sede Central");
    // The church directory lives in the menu of each node, not here.
    await expect(page.getByRole("heading", { name: "Directorio" })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("heading", { name: "Compartidos contigo" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Retiro" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Tienes invitaciones" }),
    ).toBeVisible();
  });

  test("un miembro no ve administración en el menú del nodo", async ({
    page,
  }) => {
    await asMember(page);
    await page.route(`**/organizations/${NODE_ID}`, (route) =>
      route.fulfill(
        json({ id: NODE_ID, name: "Sede Central", type: "LOCATION" }),
      ),
    );

    await page.goto(`/portal/${NODE_ID}/location`);

    const menu = page.getByRole("navigation", { name: "Navegación" });
    await expect(menu.getByText("Mi espacio", { exact: true })).toBeVisible();
    await expect(menu.getByText("Directorio", { exact: true })).toBeVisible();
    await expect(
      menu.getByText("Eventos y cursos", { exact: true }),
    ).toBeVisible();
    await expect(
      menu.getByText("Cargos y accesos", { exact: true }),
    ).toHaveCount(0);
    await expect(menu.getByText("Personas", { exact: true })).toHaveCount(0);
    await expect(
      menu.getByText("Grupos y ministerios", { exact: true }),
    ).toHaveCount(0);
    await expect(menu.getByText("Resumen", { exact: true })).toHaveCount(0);
  });

  test("quien administra también aterriza en Mi espacio y de ahí abre su sede", async ({
    page,
  }) => {
    await page.route("**/v1/me/nodes", (route) =>
      route.fulfill(
        json([
          {
            id: NODE_ID,
            name: "Sede Central",
            type: "LOCATION",
            churchId: CHURCH_ID,
            churchName: "Iglesia E2E",
            positions: ["Pastor"],
          },
        ]),
      ),
    );
    await page.route(`**/organizations/${NODE_ID}`, (route) =>
      route.fulfill(
        json({ id: NODE_ID, name: "Sede Central", type: "LOCATION" }),
      ),
    );

    await page.goto("/portal");

    await expect(page).toHaveURL(/\/portal\/me$/);
    await page
      .getByRole("list", { name: "Mis grupos y ministerios" })
      .getByRole("link", { name: "Sede Central" })
      .click();
    await expect(page).toHaveURL(new RegExp(`/portal/${NODE_ID}$`));
    await page
      .getByRole("navigation", { name: "Navegación" })
      .getByText("Mi espacio", { exact: true })
      .click();
    await expect(page).toHaveURL(/\/portal\/me$/);
  });

  test("Mi espacio con datos no tiene violaciones graves", async ({ page }) => {
    await asMember(page);

    await page.goto("/portal/me");
    await expect(page.getByText("Curso de discipulado")).toBeVisible();

    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();
    const serious = violations.filter((v) =>
      ["serious", "critical"].includes(v.impact ?? ""),
    );
    expect(
      serious.map(
        (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
      ),
    ).toEqual([]);
  });
});
