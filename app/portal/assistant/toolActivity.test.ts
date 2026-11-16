import { describe, expect, it } from "vitest";
import { toolActivityLabel } from "./toolActivity";

describe("toolActivityLabel", () => {
  it.each([
    ["get_events", "Consultando los eventos…"],
    ["get_events_id", "Consultando los eventos…"],
    ["get_events_id_attendance", "Consultando la asistencia…"],
    ["get_events_id_registrations", "Consultando las inscripciones…"],
    ["get_people", "Consultando las personas…"],
    ["get_me_organizations", "Consultando la iglesia y sus grupos…"],
    ["get_me_permissions", "Consultando los permisos…"],
    ["get_organizations_id_growth", "Consultando el crecimiento…"],
  ])("names the resource %s reads", (toolName, label) => {
    expect(toolActivityLabel(toolName)).toBe(label);
  });

  it("falls back to the data for an unknown resource", () => {
    expect(toolActivityLabel("get_complaints")).toBe("Consultando los datos…");
  });

  it("says it prepares an action for a write", () => {
    expect(toolActivityLabel("post_events")).toBe("Preparando la acción…");
    expect(toolActivityLabel("delete_people_id")).toBe("Preparando la acción…");
  });

  it("says it is searching for the tool search", () => {
    expect(toolActivityLabel("search")).toBe("Buscando qué consultar…");
    expect(toolActivityLabel("toolSearch")).toBe("Buscando qué consultar…");
  });
});
