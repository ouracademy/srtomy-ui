import { defineConfig } from "orval";

// Date-only fields ("yyyy-MM-dd" on the wire, format "date") stay strings: the
// app formats and parses them itself. Only date-time fields become Date (useDates).
const keepDateOnlyAsString = (node: unknown): void => {
  if (Array.isArray(node)) return node.forEach(keepDateOnlyAsString);
  if (node === null || typeof node !== "object") return;
  const schema = node as Record<string, unknown>;
  if (schema.format === "date") delete schema.format;
  Object.values(schema).forEach(keepDateOnlyAsString);
};

// Generates typed functions and SWR hooks from the committed OpenAPI spec.
// Output is not versioned (see .gitignore): it is rebuilt on every run.
export default defineConfig({
  srtomyApi: {
    input: {
      target: "./app/(api)/openapi/srtomy-api.json",
      override: {
        transformer: (spec) => {
          keepDateOnlyAsString(spec);
          return spec;
        },
      },
    },
    output: {
      mode: "tags-split",
      target: "./app/(api)/generated",
      client: "swr",
      clean: true,
      override: {
        useDates: true,
        fetch: {
          // customInstance returns the body only, so generated types must not wrap it.
          includeHttpResponseReturnType: false,
        },
        mutator: {
          path: "./app/(api)/client.ts",
          name: "customInstance",
        },
        // springdoc reuses operationIds across controllers (findById, findById_1, ...),
        // so names come from verb + path instead: GET /v1/people/{id} -> getPeopleById.
        operationName: (_operation, route, verb) => {
          const words = route
            .replace(/^\/v1\//, "")
            .replace(/\$?\{(\w+)\}/g, "By $1")
            .split(/[^A-Za-z0-9]+/)
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
          return verb + words.join("");
        },
      },
    },
  },
});
