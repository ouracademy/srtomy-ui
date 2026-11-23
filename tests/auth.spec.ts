import { test, expect } from "./fixtures";
import { AUTH0_DOMAIN } from "./e2e-env";

const nodeId = "11111111-1111-1111-1111-111111111111";

test.describe("Sesión", { tag: "@smoke" }, () => {
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
