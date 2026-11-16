import { describe, expect, it } from "vitest";
import type { Permission } from "@/app/(hooks)/usePermissions";
import { suggestionsFor } from "./suggestions";

const holding =
  (...permissions: Permission[]) =>
  (permission: Permission) =>
    permissions.includes(permission);

const everything = holding(
  "org.read",
  "members.read",
  "events.read",
  "registrations.read",
);

describe("suggestionsFor", () => {
  it("offers four questions about the node", () => {
    expect(suggestionsFor({ nodeId: "n" }, everything)).toEqual([
      "¿Qué eventos hay esta semana?",
      "¿Quiénes faltaron al último culto?",
      "¿Cuántas personas hay aquí?",
      "¿Cuántos visitantes llegaron este mes?",
    ]);
  });

  it("starts with the event on its detail", () => {
    const suggestions = suggestionsFor(
      { nodeId: "n", eventId: "e" },
      everything,
    );

    expect(suggestions).toHaveLength(4);
    expect(suggestions.slice(0, 3)).toEqual([
      "¿Cuántas personas asistieron a este evento?",
      "¿Quiénes se inscribieron a este evento?",
      "Resume los datos de este evento",
    ]);
  });

  it("starts with the person on their profile", () => {
    expect(suggestionsFor({ nodeId: "n", personId: "p" }, everything)[0]).toBe(
      "¿A qué grupos y ministerios pertenece esta persona?",
    );
  });

  it("offers nothing the user cannot do", () => {
    const suggestions = suggestionsFor(
      { nodeId: "n", eventId: "e" },
      holding("events.read"),
    );

    expect(suggestions).toEqual([
      "¿Cuántas personas asistieron a este evento?",
      "Resume los datos de este evento",
      "¿Qué eventos hay esta semana?",
    ]);
    expect(suggestions.join(" ")).not.toMatch(
      /inscribieron|faltaron|personas hay/,
    );
  });

  it("offers only the groups to a plain member", () => {
    expect(suggestionsFor({ nodeId: "n" }, holding("org.read"))).toEqual([
      "¿Qué grupos y ministerios hay?",
    ]);
  });

  it("offers nothing without permissions or outside a node", () => {
    expect(suggestionsFor({ nodeId: "n" }, holding())).toEqual([]);
    expect(suggestionsFor(undefined, everything)).toEqual([]);
  });
});
