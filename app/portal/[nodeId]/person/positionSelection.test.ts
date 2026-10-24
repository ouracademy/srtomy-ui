import { describe, expect, it, vi } from "vitest";
import {
  resolvePositionIds,
  toChoice,
  toPositionChoice,
} from "./positionSelection";

const positions = [{ id: "p1", name: "Pastor" }];

describe("toChoice", () => {
  it("reuses an existing position typed with another case", () => {
    expect(toChoice(" pastor ", positions)).toEqual({
      id: "p1",
      label: "Pastor",
    });
  });

  it("keeps a new name without id, and passes options through", () => {
    expect(toChoice("Catequista", positions)).toEqual({ label: "Catequista" });
    expect(toChoice({ id: "x", label: "X" }, positions)).toEqual({
      id: "x",
      label: "X",
    });
    expect(toPositionChoice({})).toEqual({ id: undefined, label: "" });
  });
});

describe("resolvePositionIds", () => {
  it("creates only the new positions, in order", async () => {
    const create = vi.fn().mockResolvedValue({ id: "new", name: "Catequista" });

    const ids = await resolvePositionIds(
      [{ id: "p1", label: "Pastor" }, { label: "Catequista" }],
      create,
    );

    expect(ids).toEqual(["p1", "new"]);
    expect(create).toHaveBeenCalledOnce();
    expect(create).toHaveBeenCalledWith("Catequista");
  });
});
