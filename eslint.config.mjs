import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier,
  {
    rules: {
      // Use console.warn / console.error; leftover debugging logs are noise.
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  {
    // React Compiler rules added by eslint-config-next 16. Existing code
    // violates them (MenuDrawer2, attendance page, dnd board); fix and move
    // back to "error" instead of adding new violations.
    rules: {
      "react-hooks/static-components": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
    },
  },
  {
    // Next loads its config with require().
    files: ["*.config.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    // Playwright fixtures expose `use`, which is not React's hook.
    files: ["tests/**"],
    rules: { "react-hooks/rules-of-hooks": "off" },
  },
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);
