import { describe, expect, it } from "vitest";
import {
  AssistantRequestError,
  parseRetryAfter,
  planLimitFrom,
} from "./assistantError";

describe("parseRetryAfter", () => {
  it("reads seconds", () => {
    expect(parseRetryAfter("12")).toBe(12);
  });

  it("reads an HTTP date", () => {
    const now = Date.parse("2026-11-15T10:00:00Z");

    expect(parseRetryAfter("Sun, 15 Nov 2026 10:00:45 GMT", now)).toBe(45);
  });

  it("ignores a missing or unreadable value", () => {
    expect(parseRetryAfter(null)).toBeUndefined();
    expect(parseRetryAfter("soon")).toBeUndefined();
  });
});

describe("AssistantRequestError", () => {
  it("keeps the status and the wait", () => {
    const error = new AssistantRequestError(429, 10);

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AssistantRequestError");
    expect(error.status).toBe(429);
    expect(error.retryAfterSeconds).toBe(10);
  });
});

describe("planLimitFrom", () => {
  it("reads the code and the text of a refusal of the plan", () => {
    expect(planLimitFrom({ error: "Sin cuota.", code: "ai.quota" })).toEqual({
      code: "ai.quota",
      message: "Sin cuota.",
    });
  });

  it("falls back to a text when the agent sends none", () => {
    expect(planLimitFrom({ code: "ai.plan" })?.message).toContain("límite");
  });

  it.each([null, "text", 42, {}, { code: "rate.limit", error: "x" }])(
    "ignores %j, which is not a refusal of the plan",
    (body) => {
      expect(planLimitFrom(body)).toBeUndefined();
    },
  );
});
