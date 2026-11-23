/**
 * The level of each test is in its file or in its Playwright tag (the `test-pyramid` skill), so CI
 * can run each level in its own stage. Runs with Node's own TypeScript support:
 *
 *   node scripts/test-levels.mts            every e2e test has exactly one of @smoke, @story, @journey
 *   node scripts/test-levels.mts --changed  the uncommitted code has a test next to it (Stop hook)
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

export const LEVELS = ["smoke", "story", "journey"] as const;

/** One test as `playwright test --list --reporter=json` reports it (only what is read here). */
interface ListedSpec {
  file: string;
  title: string;
  tags: string[];
}
interface ListedSuite {
  specs?: ListedSpec[];
  suites?: ListedSuite[];
}

/** The e2e tests that do not have exactly one level. */
export function untagged(suites: ListedSuite[]): string[] {
  const problems: string[] = [];
  const walk = (suite: ListedSuite) => {
    for (const spec of suite.specs ?? []) {
      const levels = spec.tags.filter((tag) =>
        (LEVELS as readonly string[]).includes(tag),
      );
      if (levels.length !== 1) {
        const found =
          levels.length === 0
            ? "ninguno"
            : levels.map((l) => `@${l}`).join(", ");
        problems.push(`tests/${spec.file}: «${spec.title}» tiene ${found}`);
      }
    }
    (suite.suites ?? []).forEach(walk);
  };
  suites.forEach(walk);
  return [...new Set(problems)];
}

const TEST = /\.test\.tsx?$/;

/**
 * Code whose changes need a unit or component test. Screens of the router (page, layout…) are
 * covered by the e2e of tests/, and the generated client is not tested.
 */
function needsTest(path: string): boolean {
  if (!/^app\/.+\.tsx?$/.test(path) || TEST.test(path)) return false;
  if (path.startsWith("app/(api)/generated/") || path.endsWith(".d.ts"))
    return false;
  const name = path.split("/").at(-1) ?? "";
  return !/^(page|layout|loading|error|not-found|template|default)\.tsx?$/.test(
    name,
  );
}

const stem = (path: string) =>
  (path.split("/").at(-1) ?? path).replace(/(\.test)?\.tsx?$/, "");

/**
 * The changed modules that no changed test touches. A test touches a module when it has its name
 * (`Foo.test.tsx` for `Foo.tsx`) or imports it (`./Foo`, `@/app/…/Foo`).
 */
export function missingCompanions(
  changed: string[],
  read: (path: string) => string,
): string[] {
  const tests = changed.filter(
    (path) => TEST.test(path) || path.endsWith(".spec.ts"),
  );
  const contents = tests.map((path) => read(path));
  return changed.filter(needsTest).filter((path) => {
    const name = stem(path);
    const named = tests.some((test) => stem(test) === name);
    const imported = contents.some((content) =>
      new RegExp(`/${name}["']`).test(content),
    );
    return !named && !imported;
  });
}

/** Uncommitted files that still exist (added, changed or new), relative to the repo. */
function uncommitted(): string[] {
  const status = execFileSync(
    "git",
    ["status", "--porcelain", "--untracked-files=all"],
    {
      encoding: "utf8",
    },
  );
  return status
    .split("\n")
    .filter(
      (line) =>
        line.length > 3 && !line.startsWith(" D") && !line.startsWith("D "),
    )
    .map((line) => line.slice(3).split(" -> ").at(-1) ?? "");
}

function main(args: string[]): number {
  if (args.includes("--changed")) {
    const missing = missingCompanions(uncommitted(), (path) =>
      readFileSync(path, "utf8"),
    );
    if (missing.length === 0) return 0;
    process.stderr.write(
      [
        "Este código cambió y ninguna prueba cambiada lo toca:",
        ...missing.map((path) => `  ${path}`),
        "Agrega o cambia su prueba en el nivel que pide el skill test-pyramid",
        "(.claude/skills/test-pyramid/SKILL.md). Si de verdad no hace falta (solo un comentario,",
        "un renombre), dile a la persona por qué.",
        "",
      ].join("\n"),
    );
    return 1;
  }
  const listed = execFileSync(
    process.execPath,
    [
      "node_modules/@playwright/test/cli.js",
      "test",
      "--list",
      "--reporter=json",
    ],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const problems = untagged(
    (JSON.parse(listed) as { suites: ListedSuite[] }).suites,
  );
  if (problems.length === 0) return 0;
  process.stderr.write(
    [
      "Estas pruebas e2e no dicen su nivel (@smoke, @story o @journey):",
      ...problems,
      "",
    ].join("\n"),
  );
  return 1;
}

if (process.argv[1]?.endsWith("test-levels.mts"))
  process.exitCode = main(process.argv.slice(2));
