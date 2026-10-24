import { describe, expect, it } from "vitest";
import { permissionLabel, resourceLabel } from "./permissionLabels";

describe("permission labels", () => {
  it("translates the known permissions and resources", () => {
    expect(permissionLabel("members.read")).toBe("Ver personas");
    expect(resourceLabel("iam")).toBe("Accesos");
  });

  it("falls back to the raw value for unknown ones", () => {
    expect(permissionLabel("billing.read")).toBe("billing.read");
    expect(resourceLabel("billing")).toBe("billing");
  });
});
