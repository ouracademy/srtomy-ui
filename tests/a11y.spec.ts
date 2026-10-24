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

    for (const path of [
      "/g/abc",
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
