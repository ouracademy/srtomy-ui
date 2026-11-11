import { describe, expect, it } from "vitest";
import { childrenLabels } from "./childrenLabels";

describe("childrenLabels", () => {
  it("lists sedes in a church", () => {
    expect(childrenLabels(true, false)).toEqual({
      title: "Sedes",
      create: "Agregar sede",
    });
  });

  it("says just grupos inside a group or ministry", () => {
    expect(childrenLabels(false, true)).toEqual({
      title: "Grupos",
      create: "Agregar grupo",
    });
  });

  it("keeps grupos y ministerios in a sede", () => {
    expect(childrenLabels(false, false)).toEqual({
      title: "Grupos y ministerios",
      create: "Agregar",
    });
  });
});
