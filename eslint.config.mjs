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
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
  {
    // The board passes @hello-pangea/dnd render-prop `provided` objects to
    // `ref`; the React Compiler rule reads that as a ref access during render
    // (false positive, it is the documented usage of the library).
    files: ["app/portal/[[]locId]/person/board/**"],
    rules: { "react-hooks/refs": "off" },
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
    "app/(api)/generated/**",
  ]),
]);
