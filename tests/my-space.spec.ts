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
          leader: false,
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
          memberVisibility: "CHURCH",
        },
      ]),
    ),
  );
}

test.describe("Mi espacio", () => {
  test("un miembro sin cargo aterriza en Mi espacio y ve sus cinco secciones", async ({
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
    await expect(page.getByText("Inscrito")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Mis grupos y ministerios" }),
    ).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Mis grupos y ministerios" }),
    ).toContainText("Sede Central");
    await expect(
      page.getByRole("heading", { name: "Directorio" }),
    ).toBeVisible();
    await expect(page.getByText("Domingos 10 am")).toBeVisible();
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
    await expect(menu.getByText("Dashboard", { exact: true })).toHaveCount(0);
  });

  test("quien administra aterriza en su nodo y llega a Mi espacio desde el menú", async ({
    page,
  }) => {
    await page.route(`**/organizations/${NODE_ID}`, (route) =>
      route.fulfill(
        json({ id: NODE_ID, name: "Sede Central", type: "LOCATION" }),
      ),
    );

    await page.goto("/portal");

    await expect(page).toHaveURL(new RegExp(`/portal/${NODE_ID}$`));
    await page
      .getByRole("navigation", { name: "Navegación" })
      .getByText("Mi espacio", { exact: true })
      .click();
    await expect(page).toHaveURL(/\/portal\/me$/);
    await expect(
      page.getByText("Aún no te has inscrito ni has asistido"),
    ).toBeVisible();
  });

  test("Mi espacio con datos no tiene violaciones graves", async ({ page }) => {
    await asMember(page);

    await page.goto("/portal/me");
    await expect(page.getByText("Domingos 10 am")).toBeVisible();

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
