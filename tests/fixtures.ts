import { test as base } from "@playwright/test";
import {
  AUTH0_CLIENT_ID,
  AUTH0_DOMAIN,
  APP_ORIGIN,
  CHURCH_ID,
  NODE_ID,
} from "./e2e-env";

// Auth0 silent login (prompt=none, response_mode=web_message) answers in an
// iframe with a postMessage. The token request then returns an id_token whose
// claims the SDK checks (iss, aud, nonce, sub, alg RS256). The SDK does not
// verify the signature in the browser, so a placeholder signature is enough.
const base64url = (value: object) =>
  Buffer.from(JSON.stringify(value)).toString("base64url");

async function mockAuth0(page: import("@playwright/test").Page) {
  let nonce = "";

  await page
    .context()
    .addCookies([
      { name: "auth0.is.authenticated", value: "true", url: APP_ORIGIN },
    ]);

  await page.route(`**/${AUTH0_DOMAIN}/**`, async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname === "/authorize") {
      const state = url.searchParams.get("state") ?? "";
      if (url.searchParams.get("prompt") === "none") {
        nonce = url.searchParams.get("nonce") ?? "";
      }
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: `<script>parent.postMessage({type:"authorization_response",response:{code:"e2e-code",state:${JSON.stringify(state)}}},"*");</script>`,
      });
      return;
    }

    if (url.pathname === "/oauth/token") {
      const now = Math.floor(Date.now() / 1000);
      const header = base64url({ alg: "RS256", typ: "JWT", kid: "e2e" });
      const payload = base64url({
        iss: `https://${AUTH0_DOMAIN}/`,
        aud: AUTH0_CLIENT_ID,
        sub: "auth0|e2e-user",
        iat: now,
        exp: now + 3600,
        nonce,
        name: "E2E User",
        email: "e2e@example.com",
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "e2e-access-token",
          id_token: `${header}.${payload}.e2e-signature`,
          expires_in: 86400,
          token_type: "Bearer",
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });
}

const json = (body: unknown) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify(body),
});

// Who the e2e user is: an Administrator of a church with one location
// (NODE_ID), so every screen and action is available unless a test overrides
// these routes.
async function mockCurrentUser(page: import("@playwright/test").Page) {
  await page.route("**/v1/me", (route) =>
    route.fulfill(json({ id: "e2e-user", email: "e2e@example.com" })),
  );
  await page.route("**/v1/me/organizations", (route) =>
    route.fulfill(
      json([
        {
          id: CHURCH_ID,
          name: "Iglesia E2E",
          type: "CHURCH",
          accessible: true,
          roles: ["Administrador"],
        },
        {
          id: NODE_ID,
          name: "Sede Central",
          type: "LOCATION",
          parentId: CHURCH_ID,
          accessible: true,
          roles: [],
        },
      ]),
    ),
  );
  await page.route("**/v1/me/permissions**", (route) =>
    route.fulfill(
      json([
        "org.read",
        "org.update",
        "org.create_child",
        "org.delete",
        "members.read",
        "members.write",
        "events.read",
        "events.write",
        "attendance.write",
        "positions.manage",
        "iam.read",
        "iam.manage",
      ]),
    ),
  );
  await page.route("**/v1/positions/suggestions", (route) =>
    route.fulfill(json(["Pastor", "Diácono", "Catequista"])),
  );
  await page.route("**/v1/organizations/*/positions", (route) =>
    route.fulfill(json([{ id: "p-pastor", name: "Pastor" }])),
  );
}

// Every test starts logged in. Register API mocks after this fixture runs so
// they take precedence (Playwright matches the most recent route first).
export const test = base.extend({
  page: async ({ page }, use) => {
    await mockAuth0(page);
    await mockCurrentUser(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
