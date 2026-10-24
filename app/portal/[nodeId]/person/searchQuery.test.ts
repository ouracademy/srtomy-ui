import { describe, expect, it } from "vitest";
import { searchQueryFor } from "./searchQuery";

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
