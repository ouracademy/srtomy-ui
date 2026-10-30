import { test, expect } from "./fixtures";

const churchId = "aaaaaaaa-0000-0000-0000-000000000001";
const locationId = "aaaaaaaa-0000-0000-0000-000000000002";

const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

test.describe("Alta de iglesia", () => {
  test("un usuario sin iglesias crea la suya con su primera sede, sus cargos con sus permisos y su propio cargo", async ({
    page,
  }) => {
    let created = false;
    await page.route("**/v1/me/organizations", (route) =>
      route.fulfill(
        json(
          created
            ? [
                {
                  id: churchId,
                  name: "Iglesia Vida",
                  type: "CHURCH",
                  accessible: true,
                },
                {
                  id: locationId,
                  name: "Sede Centro",
                  type: "LOCATION",
                  parentId: churchId,
                  accessible: true,
                },
              ]
            : [],
        ),
      ),
    );
    await page.route("**/v1/organizations", async (route) => {
      created = true;
      await route.fulfill(
        json({ id: churchId, name: "Iglesia Vida", type: "CHURCH" }, 201),
      );
    });
    await page.route(`**/v1/organizations/${churchId}/childs`, (route) =>
      route.fulfill(
        json([
          {
            id: locationId,
            name: "Sede Centro",
            type: "LOCATION",
            parentId: churchId,
          },
        ]),
      ),
    );
    await page.route(`**/v1/organizations/${locationId}`, (route) =>
      route.fulfill(
        json({ id: locationId, name: "Sede Centro", type: "LOCATION" }),
      ),
    );

    await page.goto("/portal");
    await expect(
      page.getByRole("heading", { name: "Bienvenido" }),
    ).toBeVisible();

    await page
      .getByRole("textbox", { name: /nombre de la iglesia/i })
      .fill("Iglesia Vida");
    await page
      .getByRole("textbox", { name: /nombre de la sede/i })
      .fill("Sede Centro");
    await page.getByRole("button", { name: "Agregar cargo" }).click();
    await page
      .getByRole("combobox", { name: "Cargo 5", exact: true })
      .fill("Diácono");
    await page.getByRole("button", { name: "Quitar cargo Maestro" }).click();
    await page.getByRole("textbox", { name: /sus nombres/i }).fill("Ana");
    await page.getByRole("textbox", { name: /sus apellidos/i }).fill("Diaz");

    const request = page.waitForRequest(
      (r) => r.method() === "POST" && r.url().endsWith("/v1/organizations"),
    );
    await page.getByRole("button", { name: "Crear iglesia" }).click();

    expect((await request).postDataJSON()).toMatchObject({
      name: "Iglesia Vida",
      location: { name: "Sede Centro" },
      positions: [
        { name: "Pastor", permissions: ["org.read", "members.write"] },
        { name: "Líder de grupo o ministerio", permissions: ["org.read"] },
        { name: "Servidor", permissions: ["org.read"] },
        { name: "Diácono", permissions: ["org.read", "events.write"] },
      ],
      creator: { firstName: "Ana", lastName: "Diaz", positionName: "Pastor" },
    });
    await expect(page).toHaveURL(new RegExp(`/portal/${locationId}$`));
    await expect(
      page.getByText(/Iglesia registrada\. Está en la sede "Sede Centro"/),
    ).toBeVisible();
  });

  test("quien ya tiene iglesia entra a Mi espacio", async ({ page }) => {
    await page.goto("/portal");

    await expect(page).toHaveURL(/\/portal\/me$/);
  });
});
