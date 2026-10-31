import { describe, expect, it } from "vitest";
import { deleteMessage } from "./program";

describe("deleteMessage", () => {
  it("only warns about the program when there is one", () => {
    expect(deleteMessage(0)).not.toContain("sub-evento");
    expect(deleteMessage(1)).toContain("También se eliminará su sub-evento");
    expect(deleteMessage(3)).toContain(
      "También se eliminará sus 3 sub-eventos",
    );
  });
});
