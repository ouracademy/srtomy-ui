import { test, expect } from "./fixtures";
import { NODE_ID } from "./e2e-env";

const json = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

test.describe("Eliminar una persona", () => {
  let deleteStatus = 204;
  let deleteBody: unknown = undefined;
  const deletes: URLSearchParams[] = [];

  test.beforeEach(async ({ page }) => {
    deleteStatus = 204;
    deleteBody = undefined;
    deletes.length = 0;
    await page.route(`**/v1/organizations/${NODE_ID}`, (route) =>
      route.fulfill(
        json({ id: NODE_ID, name: "Sede Central", type: "LOCATION" }),
      ),
    );
    await page.route("**/v1/people?*", (route) =>
      route.fulfill(
        json({
          content: [{ id: "p1", fullName: "Ana Diaz" }],
          totalElements: 1,
        }),
      ),
    );
    await page.route("**/v1/people/p1?*", async (route) => {
      if (route.request().method() !== "DELETE") return route.fallback();
      deletes.push(new URL(route.request().url()).searchParams);
      return route.fulfill({
        status: deleteStatus,
        contentType: "application/problem+json",
        body: deleteBody === undefined ? "" : JSON.stringify(deleteBody),
      });
    });
  });

  test("confirma y quita a la persona de la sede", async ({ page }) => {
    await page.goto(`/portal/${NODE_ID}/person`);
    await page.getByRole("button", { name: "Eliminar" }).click();

    const dialog = page.getByRole("dialog", {
      name: "Quitar a Ana Diaz de esta sede",
    });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Quitar" }).click();

    await expect(page.getByText("Eliminado exitosamente")).toBeVisible();
    expect(deletes).toHaveLength(1);
    expect(deletes[0]?.get("organizationId")).toBe(NODE_ID);
    expect(deletes[0]?.get("confirmUnlinkUser")).toBeNull();
  });

  test("avisa si tiene una cuenta y solo la desvincula al confirmar", async ({
    page,
  }) => {
    deleteStatus = 409;
    deleteBody = {
      title: "Conflict",
      status: 409,
      code: "PERSON_HAS_ACCOUNT",
      detail: "La persona tiene una cuenta.",
    };
    await page.goto(`/portal/${NODE_ID}/person`);
    await page.getByRole("button", { name: "Eliminar" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Quitar" })
      .click();

    const warning = page.getByRole("dialog", {
      name: "Ana Diaz tiene una cuenta",
    });
    await expect(warning).toBeVisible();

    deleteStatus = 204;
    deleteBody = undefined;
    await warning
      .getByRole("button", { name: "Eliminar y quitar acceso" })
      .click();

    await expect(page.getByText("Eliminado exitosamente")).toBeVisible();
    expect(deletes).toHaveLength(2);
    expect(deletes[1]?.get("confirmUnlinkUser")).toBe("true");
  });

  test("muestra lo que dice la API si rechaza la eliminación", async ({
    page,
  }) => {
    deleteStatus = 403;
    deleteBody = { detail: "La persona no pertenece a este grupo" };
    await page.goto(`/portal/${NODE_ID}/person`);
    await page.getByRole("button", { name: "Eliminar" }).click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Quitar" })
      .click();

    await expect(
      page.getByText("La persona no pertenece a este grupo"),
    ).toBeVisible();
  });

  test("sin el permiso no se ofrece eliminar", async ({ page }) => {
    await page.route("**/v1/me/permissions**", (route) =>
      route.fulfill(json(["org.read", "members.read", "members.write"])),
    );
    await page.goto(`/portal/${NODE_ID}/person`);

    await expect(page.getByText("Ana Diaz")).toBeVisible();
    await expect(page.getByRole("button", { name: "Ver" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Eliminar" })).toHaveCount(0);
  });
});
