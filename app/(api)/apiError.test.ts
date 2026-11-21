import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { apiErrorBody, apiErrorStatus } from "./apiError";

const answered = (status: number, data?: unknown) =>
  new AxiosError("failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  });

describe("apiErrorStatus", () => {
  it("returns the status the API answered with", () => {
    expect(apiErrorStatus(answered(404))).toBe(404);
  });

  it("is undefined without an answer or for other errors", () => {
    expect(apiErrorStatus(new AxiosError("offline"))).toBeUndefined();
    expect(apiErrorStatus(new Error("bug"))).toBeUndefined();
    expect(apiErrorStatus(undefined)).toBeUndefined();
  });
});

describe("apiErrorBody", () => {
  it("returns the problem+json body", () => {
    const body = { detail: "Sin permiso", code: "FORBIDDEN" };

    expect(apiErrorBody(answered(403, body))).toEqual(body);
  });

  it("is undefined when the body is not an object", () => {
    expect(apiErrorBody(answered(500, "Internal error"))).toBeUndefined();
    expect(apiErrorBody(answered(500))).toBeUndefined();
    expect(apiErrorBody(new Error("bug"))).toBeUndefined();
  });
});
