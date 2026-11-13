import { describe, expect, it } from "vitest";
import { permissionLabel, resourceLabel } from "./permissionLabels";

describe("permission labels", () => {
  it("translates the known permissions and resources", () => {
    expect(permissionLabel("members.read")).toBe("Ver personas");
    expect(permissionLabel("members.delete")).toBe("Eliminar personas");
    expect(resourceLabel("iam")).toBe("Accesos");
    expect(permissionLabel("invitations.send")).toBe(
      "Invitar a usar la aplicación",
    );
    expect(resourceLabel("invitations")).toBe("Invitaciones");
    expect(resourceLabel("org")).toBe("Iglesia, sedes y grupos");
  });

  it("names each thing that can be done with the registration of an event", () => {
    expect(resourceLabel("registrations")).toBe("Inscripciones");
    expect(
      [
        "registrations.read",
        "registrations.configure",
        "registrations.close",
        "registrations.remove",
      ].map((permission) => permissionLabel(permission)),
    ).toEqual([
      "Ver la inscripción y a quienes se inscribieron",
      "Activar, cambiar o quitar la inscripción",
      "Cerrar y reabrir las inscripciones",
      "Quitar a una persona inscrita",
    ]);
  });

  it("falls back to the raw value for unknown ones", () => {
    expect(permissionLabel("billing.read")).toBe("billing.read");
    expect(resourceLabel("billing")).toBe("billing");
  });

  it("words the node permissions for any kind of node", () => {
    expect(permissionLabel("org.update")).toBe(
      "Editar nombre, dirección, teléfono y redes de la iglesia, sede, grupo o ministerio",
    );
    expect(permissionLabel("org.read")).toContain("iglesia, sede, grupo");
  });
});
