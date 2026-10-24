// Fake Auth0 tenant for e2e. The app reads these as NEXT_PUBLIC_* values (see
// playwright.config.ts webServer.env); the tests intercept every request to
// AUTH0_DOMAIN, so no real Auth0 tenant or login is involved.
export const AUTH0_DOMAIN = "test.auth0.local";
export const AUTH0_CLIENT_ID = "e2e-client";
// Run e2e on another port (E2E_PORT=3100 pnpm test:e2e) while a dev server
// already uses 3000, so the tests never reuse a server with real env values.
export const E2E_PORT = process.env.E2E_PORT ?? "3000";
export const APP_ORIGIN = `http://localhost:${E2E_PORT}`;
// The church and location the e2e user belongs to (see tests/fixtures.ts).
export const CHURCH_ID = "00000000-0000-0000-0000-00000000c0de";
export const NODE_ID = "11111111-1111-1111-1111-111111111111";
