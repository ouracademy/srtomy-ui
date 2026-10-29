import { describe, expect, it } from "vitest";
import {
  permissionLabel,
  reachLabel,
  resourceLabel,
  type NodeType,
} from "./permissionLabels";

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
    expect(permissionLabel("billing.read", "CHURCH")).toBe("billing.read");
    expect(resourceLabel("billing")).toBe("billing");
  });

  it("words the node permissions neutrally when the node is not known", () => {
    expect(permissionLabel("org.update")).toBe(
      "Editar nombre, dirección, teléfono y redes de la iglesia, sede, grupo o ministerio",
    );
    expect(permissionLabel("org.read")).toContain("iglesia, sede, grupo");
  });

  it.each<[NodeType, string]>([
    [
      "CHURCH",
      "Editar nombre, dirección, teléfono y redes de esta iglesia y de todas sus sedes, grupos y ministerios",
    ],
    [
      "LOCATION",
      "Editar nombre, dirección, teléfono y redes de esta sede y de sus grupos y ministerios",
    ],
    [
      "GROUP",
      "Editar nombre, dirección, teléfono y redes de este grupo y de los grupos que contiene",
    ],
    [
      "MINISTRY",
      "Editar nombre, dirección, teléfono y redes de este ministerio y de los grupos que contiene",
    ],
  ])("words org.update for a %s", (type, expected) => {
    expect(permissionLabel("org.update", type)).toBe(expected);
  });

  it("words reading, creating and deleting for each kind of node", () => {
    expect(permissionLabel("org.read", "LOCATION")).toBe(
      "Ver los datos de esta sede y de sus grupos y ministerios",
    );
    expect(permissionLabel("org.create_child", "CHURCH")).toBe(
      "Crear sedes, grupos y ministerios",
    );
    expect(permissionLabel("org.create_child", "LOCATION")).toBe(
      "Crear grupos y ministerios",
    );
    expect(permissionLabel("org.create_child", "GROUP")).toBe(
      "Crear grupos dentro de este grupo",
    );
    expect(permissionLabel("org.create_child", "MINISTRY")).toBe(
      "Crear grupos dentro de este ministerio",
    );
    expect(permissionLabel("org.delete", "CHURCH")).toBe(
      "Eliminar grupos y ministerios",
    );
    expect(permissionLabel("org.delete", "GROUP")).toBe(
      "Eliminar este grupo y los grupos que contiene",
    );
  });

  it("keeps the permissions that do not depend on the node as they are", () => {
    expect(permissionLabel("members.write", "GROUP")).toBe(
      "Crear y editar personas",
    );
  });

  it("says how far a role reaches from each kind of node", () => {
    expect(reachLabel("CHURCH")).toBe(
      "Estos permisos valen para esta iglesia y para todas sus sedes, grupos y ministerios.",
    );
    expect(reachLabel("GROUP")).toBe(
      "Estos permisos valen para este grupo y para los grupos que contiene.",
    );
  });
});
