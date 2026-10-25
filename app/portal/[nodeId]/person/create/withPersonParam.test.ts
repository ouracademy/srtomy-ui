import { describe, expect, it } from "vitest";
import { withPersonParam } from "./withPersonParam";

describe("withPersonParam", () => {
  it("adds the person keeping the existing query", () => {
    expect(withPersonParam("/portal/n1/positions?tab=invitaciones", "p1")).toBe(
      "/portal/n1/positions?tab=invitaciones&persona=p1",
    );
  });

  it("adds the query when there is none", () => {
    expect(withPersonParam("/portal/n1/positions", "p1")).toBe(
      "/portal/n1/positions?persona=p1",
    );
  });
});
