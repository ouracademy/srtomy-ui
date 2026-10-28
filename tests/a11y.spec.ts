import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "./fixtures";

const nodeId = "11111111-1111-1111-1111-111111111111";

const json = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

test.describe("Accesibilidad", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/organizations/*/positions**", (route) =>
      route.fulfill(json([])),
    );
    await page.route(`**/organizations/${nodeId}`, (route) =>
      route.fulfill(
        json({ id: nodeId, name: "Sede Central", type: "LOCATION" }),
      ),
    );
    await page.route("**/organizations/*/childs**", (route) =>
      route.fulfill(json([])),
    );
    await page.route("**/people**", (route) =>
      route.fulfill(json({ content: [] })),
    );
  });

  const pages = [
    { name: "Crear grupo", path: `/portal/${nodeId}/location/groups/create` },
    { name: "Registrar persona", path: `/portal/${nodeId}/person/create` },
    { name: "Cargos", path: `/portal/${nodeId}/positions` },
    { name: "Mi espacio", path: "/portal/me" },
  ];

  for (const { name, path } of pages) {
    test(`${name} no tiene violaciones graves`, async ({ page }) => {
      await page.goto(path);
      await page.getByRole("main").waitFor();

      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const serious = violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? ""),
      );
      expect(
        serious.map(
          (v) =>
            `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
        ),
      ).toEqual([]);
    });
  }

  test("Página pública, invitación y directorio no tienen violaciones graves", async ({
    page,
  }) => {
    await page.route("**/v1/public/organizations/abc", (route) =>
      route.fulfill(
        json({
          name: "Iglesia E2E",
          type: "CHURCH",
          schedule: "Domingos 10 am",
          socialLinks: { website: "https://iglesia.example" },
          leaders: ["Ana Díaz"],
          positions: [{ position: "Pastor", people: ["Pedro Pastor"] }],
          orgChart: {
            name: "Iglesia E2E",
            type: "CHURCH",
            slug: "abc",
            leaders: [],
            children: [
              { name: "Sede Norte", slug: "norte", leaders: [], children: [] },
            ],
          },
        }),
      ),
    );
    await page.route("**/v1/public/invitations/tok", (route) =>
      route.fulfill(
        json({
          email: "ana@example.com",
          organizationName: "Sede Central",
          positionName: "Ujier",
          status: "PENDING",
        }),
      ),
    );
    await page.route("**/v1/organizations/*/directory", (route) =>
      route.fulfill(
        json([
          {
            id: nodeId,
            name: "Sede Central",
            type: "LOCATION",
            schedule: "Domingos",
            leaders: ["Ana Díaz"],
            memberVisibility: "CHURCH",
          },
        ]),
      ),
    );

    await page.route("**/v1/public/events/curso", (route) =>
      route.fulfill(
        json({
          title: "Curso de discipulado",
          start: "2030-01-05T15:00:00Z",
          end: "2030-01-05T17:00:00Z",
          isACourse: true,
          organizationName: "Jóvenes",
          canRegister: true,
          registration: {
            open: true,
            requiresAccount: false,
            soldOut: false,
            tickets: [
              {
                id: "t1",
                name: "General",
                priceCents: 0,
                currency: "PEN",
                onSale: true,
                remaining: 12,
              },
              {
                id: "t2",
                name: "VIP",
                priceCents: 2500,
                currency: "PEN",
                onSale: true,
                remaining: 0,
              },
            ],
          },
        }),
      ),
    );
    await page.route("**/v1/public/attendance/tok", (route) =>
      route.fulfill(
        json({
          title: "Culto dominical",
          start: "2030-01-05T15:00:00Z",
          organizationName: "Iglesia E2E",
          status: "OPEN",
        }),
      ),
    );

    for (const path of [
      "/g/abc",
      "/e/curso",
      "/a/tok",
      "/e/curso/cancelar/codigo",
      "/invitacion/tok",
      `/portal/${nodeId}/directory`,
    ]) {
      await page.goto(path);
      await page
        .getByRole("main")
        .or(page.getByRole("list").first())
        .first()
        .waitFor();

      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();

      const serious = violations.filter((v) =>
        ["serious", "critical"].includes(v.impact ?? ""),
      );
      expect(
        serious.map(
          (v) =>
            `${path} ${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`,
        ),
      ).toEqual([]);
    }
  });
});
