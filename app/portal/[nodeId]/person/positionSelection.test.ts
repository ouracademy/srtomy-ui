import { describe, expect, it, vi } from "vitest";
import {
  accessHints,
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

describe("accessHints", () => {
  const church = [
    { id: "p1", name: "Pastor", accessRoleId: "l-admin" },
    { id: "p2", name: "Hermano" },
  ];
  const levels = [{ id: "l-admin", name: "Administrador" }];

  it("names the level of each chosen position that gives access", () => {
    expect(
      accessHints(
        [
          { id: "p1", label: "Pastor" },
          { id: "p2", label: "Hermano" },
        ],
        church,
        levels,
      ),
    ).toEqual(["Pastor: Administrador"]);
  });

  it("says nothing for labels and for names that are new", () => {
    expect(accessHints([{ label: "Nuevo" }], church, levels)).toEqual([]);
    expect(accessHints([{ id: "p2", label: "Hermano" }], church, [])).toEqual(
      [],
    );
  });

  it("still flags access when the level's name cannot be read", () => {
    expect(accessHints([{ id: "p1", label: "Pastor" }], church, [])).toEqual([
      "Pastor: Con acceso a la app",
    ]);
  });
});
