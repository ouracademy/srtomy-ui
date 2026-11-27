import { describe, expect, it } from "vitest";

import { missingCompanions, untagged } from "./test-levels.mjs";

const spec = (title: string, tags: string[]) => ({
  file: "groups.spec.ts",
  title,
  tags,
});

describe("untagged", () => {
  it("accepts tests with exactly one level, nested at any depth", () => {
    expect(
      untagged([
        {
          specs: [spec("a", ["smoke"])],
          suites: [{ specs: [spec("b", ["story", "a11y"])] }],
        },
        { suites: [{ suites: [{ specs: [spec("c", ["journey"])] }] }] },
      ]),
    ).toEqual([]);
  });

  it("names a test with no level", () => {
    expect(untagged([{ specs: [spec("crea un grupo", [])] }])).toEqual([
      "tests/groups.spec.ts: «crea un grupo» tiene ninguno",
    ]);
  });

  it("refuses a test with two levels, once even if every browser lists it", () => {
    const twice = spec("crea un grupo", ["story", "journey"]);

    expect(untagged([{ specs: [twice, twice] }])).toEqual([
      "tests/groups.spec.ts: «crea un grupo» tiene @story, @journey",
    ]);
  });
});

describe("missingCompanions", () => {
  const files: Record<string, string> = {
    "app/(components)/SaveButton.test.tsx":
      'import { SaveButton } from "./SaveButton";',
    "app/portal/x.test.ts": 'import { f } from "@/app/(api)/services/people";',
  };
  const read = (path: string) => files[path] ?? "";

  it("accepts code changed with a test of the same name or one that imports it", () => {
    expect(
      missingCompanions(
        [
          "app/(components)/SaveButton.tsx",
          "app/(api)/services/people.ts",
          "app/(components)/SaveButton.test.tsx",
          "app/portal/x.test.ts",
        ],
        read,
      ),
    ).toEqual([]);
  });

  it("names the code that changed with no test", () => {
    expect(
      missingCompanions(
        ["app/(components)/Loading.tsx", "app/portal/x.test.ts"],
        read,
      ),
    ).toEqual(["app/(components)/Loading.tsx"]);
  });

  it("asks nothing of router screens, generated code, types or files that are not code", () => {
    expect(
      missingCompanions(
        [
          "app/portal/[nodeId]/page.tsx",
          "app/layout.tsx",
          "app/(api)/generated/people.ts",
          "types/x.d.ts",
          "README.md",
        ],
        read,
      ),
    ).toEqual([]);
  });
});
