import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import { APP_ORIGIN, E2E_PORT } from "./tests/e2e-env";

// Local only: CI injects its own variables, and loadEnvFile never overrides
// variables that are already set.
if (!process.env.CI && existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

// Fail fast instead of falling back to a fake value. A fake Builder key makes
// every page 404 and the suite times out for minutes before reporting it.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name}. Set it in .env.local (see .env.local.example) or, in CI, in the "dev" environment.`,
    );
  }
  return value;
}

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry once on CI; a retry on a timeout costs time, so keep it low. */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [["list"], ["html"]] : "html",
  /* Fail a single assertion or click in 10s instead of waiting for the whole test. */
  expect: { timeout: 10 * 1000 },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: APP_ORIGIN,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Fail a click or fill that is blocked (e.g. by an overlay) in 10s. */
    actionTimeout: 10 * 1000,
  },

  /* Configure projects for major browsers */
  timeout: 30 * 1000,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      // dependencies: ["setup"],
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      // dependencies: ["setup"],
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `pnpm dev --port ${E2E_PORT}`,
    url: APP_ORIGIN,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    // Auth0 values are fixed on purpose: tests/fixtures.ts intercepts requests
    // to test.auth0.local, so they must not come from secrets. The Builder key
    // is required because the home page is served from Builder.
    env: {
      E2E_TEST: "1",
      NEXT_PUBLIC_AUTH0_DOMAIN: "test.auth0.local",
      NEXT_PUBLIC_AUTH0_CLIENT_ID: "e2e-client",
      NEXT_PUBLIC_BUILDER_API_KEY: requireEnv("NEXT_PUBLIC_BUILDER_API_KEY"),
      NEXT_PUBLIC_API_URL: "http://localhost:8080",
    },
  },
});
