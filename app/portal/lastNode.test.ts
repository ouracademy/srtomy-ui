import { afterEach, describe, expect, it, vi } from "vitest";
import { readLastNode, saveLastNode } from "./lastNode";

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("lastNode", () => {
  it("round-trips the node id", () => {
    saveLastNode("abc");
    expect(readLastNode()).toBe("abc");
  });

  it("is a no-op when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => saveLastNode("abc")).not.toThrow();
    expect(readLastNode()).toBeNull();
  });
});
