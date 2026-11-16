import { describe, expect, it } from "vitest";
import { approvalFields, isDeletion, isWrite } from "./approval";

describe("approval helpers", () => {
  it("tells writes from reads and deletions from other writes", () => {
    expect(isWrite("post_events")).toBe(true);
    expect(isWrite("get_events")).toBe(false);
    expect(isDeletion("delete_people_id")).toBe(true);
    expect(isDeletion("put_events_id")).toBe(false);
  });

  it("summarizes the body with Spanish labels and without ids", () => {
    expect(
      approvalFields({
        organizationId: "n-1",
        body: {
          name: "Ensayo",
          startTime: "2026-11-20T19:00",
          container: false,
        },
      }),
    ).toEqual([
      { label: "Nombre", value: "Ensayo" },
      { label: "Inicio", value: "2026-11-20T19:00" },
      { label: "container", value: "No" },
    ]);
  });

  it("joins lists and skips empty and nested values", () => {
    expect(
      approvalFields({ id: "x", tags: ["a", "b"], empty: "", obj: { a: 1 } }),
    ).toEqual([{ label: "tags", value: "a, b" }]);
  });

  it("has no fields for a call without data", () => {
    expect(approvalFields(undefined)).toEqual([]);
    expect(approvalFields("x")).toEqual([]);
  });
});
