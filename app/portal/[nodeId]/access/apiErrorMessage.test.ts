import { AxiosError } from "axios";
import { describe, expect, it } from "vitest";
import { apiErrorMessage } from "./apiErrorMessage";

const failure = (data: unknown) =>
  new AxiosError("fail", "ERR_BAD_REQUEST", undefined, undefined, {
    status: 400,
    data,
  } as never);

describe("apiErrorMessage", () => {
  it("shows the detail the API sent", () => {
    expect(apiErrorMessage(failure({ detail: "Ya existe" }), "x")).toBe(
      "Ya existe",
    );
  });

  it("uses the fallback without a usable detail", () => {
    expect(apiErrorMessage(failure({}), "x")).toBe("x");
    expect(apiErrorMessage(failure({ detail: "  " }), "x")).toBe("x");
    expect(apiErrorMessage(new Error("boom"), "x")).toBe("x");
  });
});
