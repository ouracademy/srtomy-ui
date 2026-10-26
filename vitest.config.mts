import { defineConfig } from "vitest/config";

export default defineConfig({
  // Reads the "@/*" alias from tsconfig.json instead of repeating it here.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    include: ["app/**/*.test.{ts,tsx}"],
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 15000,
    coverage: {
      provider: "v8",
      // No `include`: coverage is measured on the modules the unit tests load,
      // so a new tested module is covered without editing this file. UI flows
      // are covered by e2e (Playwright), not here.
      exclude: ["**/*.test.{ts,tsx}"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
