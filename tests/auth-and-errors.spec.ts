import { test, expect } from "./fixtures";
import { AUTH0_DOMAIN } from "./e2e-env";

const nodeId = "11111111-1111-1111-1111-111111111111";

test.describe("Sesión", () => {
  test("un visitante anónimo es enviado a Auth0 sin llamar a la API", async ({
    page,
  }) => {
    // Without the "is authenticated" cookie the SDK skips silent login.
    await page.context().clearCookies();
    const apiCalls: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/organizations")) {
        apiCalls.push(request.url());
      }
    });

    const login = page.waitForRequest(
      (request) =>
        request.url().includes(`${AUTH0_DOMAIN}/authorize`) &&
        !request.url().includes("prompt=none"),
      // The first visit compiles the page in the dev server.
      { timeout: 60_000 },
    );
    await page.goto(`/portal/${nodeId}/person`, { waitUntil: "commit" });
    await login;

    expect(apiCalls).toEqual([]);
  });
});

test.describe("Errores de carga", () => {
  test("muestra un mensaje cuando falla una petición", async ({ page }) => {
    await page.route("**/organizations/*/positions**", (route) =>
      route.fulfill({ status: 500, body: "{}" }),
    );

    await page.goto(`/portal/${nodeId}/person/create`);

    await expect(
      page.getByText("No se pudo cargar la información"),
    ).toBeVisible();
  });

  test("muestra el indicador de carga y no 'Not found' mientras cargan los datos", async ({
    page,
  }) => {
    await page.route("**/organizations/*/positions**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
    });

    await page.goto(`/portal/${nodeId}/person/create`);

    await expect(page.getByRole("progressbar")).toBeVisible();
    await expect(page.getByText("Not found")).toHaveCount(0);
  });

  test("muestra 'No encontrado' cuando el recurso no existe (404)", async ({
    page,
  }) => {
    await page.route("**/organizations/999", (route) =>
      route.fulfill({ status: 404, body: "{}" }),
    );
    await page.goto(`/portal/999/location`);

    await expect(
      page.getByRole("heading", { name: "No encontrado" }),
    ).toBeVisible();
  });

  test("ofrece reintentar cuando la petición falla", async ({ page }) => {
    await page.route("**/organizations/*/positions**", (route) =>
      route.fulfill({ status: 500, body: "{}" }),
    );

    await page.goto(`/portal/${nodeId}/person/create`);

    await expect(
      page.getByRole("button", { name: "Reintentar" }),
    ).toBeVisible();
  });
});
