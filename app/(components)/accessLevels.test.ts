import { describe, expect, it } from "vitest";
import {
  NO_LEVEL,
  assignableLevels,
  levelIdByName,
  levelLabel,
  toAccessRoleId,
} from "./accessLevels";

const levels = [
  { id: "l-owner", name: "Propietario", assignable: false },
  { id: "l-admin", name: "Administrador", assignable: true },
  { id: "l-custom", name: "Tesorero" },
];

describe("accessLevels", () => {
  it("never offers Owner but keeps levels the API does not flag", () => {
    expect(assignableLevels(levels).map((l) => l.name)).toEqual([
      "Administrador",
      "Tesorero",
    ]);
  });

  it("finds a level by name, or none", () => {
    expect(levelIdByName(levels, "Administrador")).toBe("l-admin");
    expect(levelIdByName(levels, "Líder")).toBe(NO_LEVEL);
  });

  it("sends no level for a plain label", () => {
    expect(toAccessRoleId(NO_LEVEL)).toBeUndefined();
    expect(toAccessRoleId("")).toBeUndefined();
    expect(toAccessRoleId("l-admin")).toBe("l-admin");
  });

  it("words a level, a missing level and an unreadable one", () => {
    expect(levelLabel(levels, "l-admin")).toBe("Administrador");
    expect(levelLabel(levels, undefined)).toBe("Sin acceso a la app");
    expect(levelLabel([], "l-admin")).toBe("Con acceso a la app");
  });
});
