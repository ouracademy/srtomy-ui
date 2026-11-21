// Architecture rules, taken from docs/architecture.md and the constitution
// (.specify/memory/constitution.md, "Technical Constraints"). `pnpm check:arch`
// runs them. .dependency-cruiser-known-violations.json is the baseline for
// violations a new rule finds in existing code: it stays empty unless the
// product owner accepts one, and it is never extended to let a change pass.
//
// Vocabulary used below:
//   - api layer:   app/(api)/        everything that talks to srtomy-api or srtomy-agent
//   - shared:      app/(components)/ and app/(hooks)/, used by two or more screens
//   - route tree:  any other folder directly under app/ (portal, landing, e, g, ...)
//   - test code:   *.test.ts(x), *.test-utils.ts(x) and tests/ (Playwright)

/** Matches test files and their helpers. */
const TEST = "(\\.test(-utils)?\\.tsx?$)|(^tests/)";

/** Route trees: a folder directly under app/ that is not a route group. */
const ROUTE_TREE = "^app/[^(/][^/]*/";

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "Import cycles make modules impossible to understand or test on their own. Move the shared part into a third module.",
      from: {},
      to: { circular: true },
    },
    {
      name: "axios-only-in-api-layer",
      severity: "error",
      comment:
        "Components never use axios directly (architecture.md, «Datos»): every call goes through app/(api)/. To tell API errors apart, use or extend a helper there.",
      from: { path: "^app/", pathNot: ["^app/\\(api\\)/", TEST] },
      to: { path: "node_modules/axios/" },
    },
    {
      name: "api-layer-is-ui-free",
      severity: "error",
      comment:
        "app/(api)/ is the bottom layer: it must not import shared UI or screens, or the API code ends up depending on the screens that use it.",
      from: { path: "^app/\\(api\\)/", pathNot: TEST },
      to: {
        path: ["^app/\\((components|hooks)\\)/", ROUTE_TREE],
        pathNot: "^app/src/",
      },
    },
    {
      name: "shared-does-not-import-screens",
      severity: "error",
      comment:
        "app/(components)/ and app/(hooks)/ hold what two or more screens share; they must not depend on a single screen. Move the needed piece into the shared folder.",
      from: { path: "^app/\\((components|hooks)\\)/", pathNot: TEST },
      to: { path: ROUTE_TREE, pathNot: "^app/src/" },
    },
    {
      name: "portal-sections-do-not-import-each-other",
      severity: "error",
      comment:
        "Each section of a node (person, event, positions, ...) keeps its code next to its page (proximity rule). If two sections need the same thing, move it to app/(components)/ or app/(hooks)/.",
      from: { path: "^app/portal/\\[nodeId\\]/([^/]+)/", pathNot: TEST },
      to: {
        path: "^app/portal/\\[nodeId\\]/[^/]+/",
        pathNot: "^app/portal/\\[nodeId\\]/$1/",
      },
    },
    {
      name: "route-trees-do-not-import-each-other",
      severity: "error",
      comment:
        "Screens must not know each other (architecture.md): a route tree (portal, landing, e, g, ...) does not import another one. Shared code goes in app/(components)/ or app/(hooks)/. The legal pages may use the landing frame (LegalLayout, LegalDocument, LandingFooter), as the architecture documents.",
      from: {
        path: "^app/([^(/][^/]*)/",
        pathNot: [
          TEST,
          "^app/src/",
          "^app/(terms-conditions|privacy-policy|complaints-book)/",
        ],
      },
      to: {
        path: ROUTE_TREE,
        pathNot: ["^app/$1/", "^app/src/"],
      },
    },
    {
      name: "only-legal-pages-use-the-landing-frame",
      severity: "error",
      comment:
        "Exception to route-trees-do-not-import-each-other, kept narrow: only the legal pages may import the landing frame.",
      from: {
        path: "^app/(terms-conditions|privacy-policy|complaints-book)/",
        pathNot: TEST,
      },
      to: {
        path: "^app/landing/",
        pathNot:
          "^app/landing/(LegalLayout|LegalDocument|LandingFooter)\\.tsx$",
      },
    },
    {
      name: "no-features-or-utils-folders",
      severity: "error",
      comment:
        "No features/ or utils/ folders (AGENTS.md): code lives next to what uses it, and shared code goes in a folder named after its kind.",
      from: { path: "(^|/)(features|utils)/" },
      to: {},
    },
    {
      name: "production-code-does-not-import-tests",
      severity: "error",
      comment: "Test files and test helpers must not end up in the app bundle.",
      from: { path: "^app/", pathNot: TEST },
      to: { path: TEST },
    },
    {
      name: "production-code-does-not-import-dev-dependencies",
      severity: "error",
      comment:
        "A devDependency is not installed in production builds. Move the package to dependencies or keep it in test code.",
      from: { path: "^app/", pathNot: TEST },
      to: { dependencyTypes: ["npm-dev"], dependencyTypesNot: ["type-only"] },
    },
    {
      name: "not-to-unresolvable",
      severity: "error",
      comment: "The import does not resolve to a file or an installed package.",
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  allowed: [],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: {
      path: [
        "^\\.next/",
        "^coverage/",
        "^playwright-report/",
        "^test-results/",
      ],
    },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      mainFields: ["module", "main", "types", "typings"],
      extensions: [
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".mjs",
        ".cjs",
        ".json",
        ".d.ts",
      ],
    },
    skipAnalysisNotInRules: true,
  },
};
