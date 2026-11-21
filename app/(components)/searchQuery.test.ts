import { describe, expect, it } from "vitest";
import { queryWith, searchQueryFor } from "./searchQuery";

describe("searchQueryFor", () => {
  it("returns null when the url already has the search", () => {
    expect(searchQueryFor("", "")).toBeNull();
    expect(searchQueryFor("search=ana", "ana")).toBeNull();
  });

  it("sets the search and keeps other params", () => {
    expect(searchQueryFor("foo=1", "ana")).toBe("foo=1&search=ana");
  });

  it("removes the search when the text is cleared", () => {
    expect(searchQueryFor("search=ana&foo=1", "")).toBe("foo=1");
  });
});

describe("queryWith", () => {
  it("sets any parameter and keeps the others", () => {
    expect(queryWith("search=ana", "estado", "MEMBER")).toBe(
      "search=ana&estado=MEMBER",
    );
  });

  it("replaces the value it already has", () => {
    expect(queryWith("estado=VISITOR", "estado", "MEMBER")).toBe(
      "estado=MEMBER",
    );
  });

  it("returns null when the url already holds the value", () => {
    expect(queryWith("estado=MEMBER", "estado", "MEMBER")).toBeNull();
    expect(queryWith("", "estado", "")).toBeNull();
  });

  it("removes the parameter when the value is empty", () => {
    expect(queryWith("estado=MEMBER&search=ana", "estado", "")).toBe(
      "search=ana",
    );
  });
});
