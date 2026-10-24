import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PositionsManager } from "./PositionsManager";

afterEach(cleanup);

const catalog = [
  { resource: "members", permissions: ["members.read", "members.write"] },
  { resource: "events", permissions: ["events.read"] },
];

const positions = [
  {
    id: "p1",
    name: "Pastor",
    permissions: ["members.read", "members.write"],
    effectivePermissions: ["members.read", "members.write"],
    holders: [
      {
        personId: "a",
        name: "Ana Díaz",
        organizationName: "Sede Central",
        email: "ana@x.org",
      },
      { personId: "b", name: "Luis Rojas", organizationName: "Sede Norte" },
    ],
  },
  {
    id: "p2",
    name: "Ujier",
    permissions: [],
    effectivePermissions: [],
    holders: [],
  },
  {
    id: "p3",
    name: "Tesorero",
    permissions: ["events.read"],
    // One more permission comes from a role, so it cannot be unchecked here.
    effectivePermissions: ["events.read", "members.read"],
    holders: [],
  },
];

const setup = (canManage = true) => {
  const handlers = {
    onCreate: vi.fn().mockResolvedValue(undefined),
    onRename: vi.fn().mockResolvedValue(undefined),
    onSetPermissions: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <PositionsManager
      positions={positions}
      suggestions={[
        { name: "Pastor", permissions: ["members.write"] },
        { name: "Catequista", permissions: ["events.read"] },
        { name: "Intercesor", permissions: [] },
      ]}
      catalog={catalog}
      canManage={canManage}
      {...handlers}
    />,
  );
  return { user: userEvent.setup(), ...handlers };
};

describe("PositionsManager", () => {
  it("shows each position with what it gives and how many people hold it", () => {
    setup();

    expect(
      screen.getByRole("row", { name: /Pastor.*2 permisos.*2/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("row", { name: /Ujier.*Sin acceso a la app.*0/ }),
    ).toBeInTheDocument();
  });

  it("lists the permissions of a position from its info icon", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", { name: "Ver permisos de Pastor" }),
    );

    expect(screen.getByText("Permisos de Pastor")).toBeInTheDocument();
    expect(
      screen.getAllByText("Crear y editar personas").length,
    ).toBeGreaterThan(0);
  });

  it("opens a position to see its permissions by module and its people", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Abrir Pastor" }));

    expect(
      screen.getByRole("checkbox", { name: "Crear y editar personas" }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Ver eventos y cursos" }),
    ).not.toBeChecked();
    expect(
      screen.getByText(/Ana Díaz · Sede Central · ana@x.org/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Luis Rojas · Sede Norte · sin cuenta/),
    ).toBeInTheDocument();
  });

  it("saves the permissions marked, asking first when people with an account hold it", async () => {
    const { user, onSetPermissions } = setup();

    await user.click(screen.getByRole("button", { name: "Abrir Pastor" }));
    await user.click(
      screen.getByRole("checkbox", { name: "Ver eventos y cursos" }),
    );
    await user.click(screen.getByRole("button", { name: "Guardar permisos" }));

    expect(onSetPermissions).not.toHaveBeenCalled();
    expect(
      screen.getByText(/1 persona con cuenta tiene el cargo Pastor/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cambiar permisos" }));
    expect(onSetPermissions).toHaveBeenCalledWith("p1", [
      "members.read",
      "members.write",
      "events.read",
    ]);
  });

  it("saves at once a position nobody with an account holds", async () => {
    const { user, onSetPermissions } = setup();

    await user.click(screen.getByRole("button", { name: "Abrir Ujier" }));
    await user.click(screen.getByRole("checkbox", { name: "Personas" }));
    await user.click(screen.getByRole("button", { name: "Guardar permisos" }));

    expect(onSetPermissions).toHaveBeenCalledWith("p2", [
      "members.read",
      "members.write",
    ]);
  });

  it("does not offer to save until something changes", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Abrir Ujier" }));

    expect(
      screen.getByRole("button", { name: "Guardar permisos" }),
    ).toBeDisabled();
  });

  it("shows the permissions that come from a role as fixed", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Abrir Tesorero" }));

    const fixed = screen.getByRole("checkbox", { name: "Ver personas" });
    expect(fixed).toBeChecked();
    expect(fixed).toBeDisabled();
  });

  it("adds a position with any wording and no permissions", async () => {
    const { user, onCreate } = setup();

    await user.type(
      screen.getByRole("combobox", { name: "Nuevo cargo" }),
      "Hermano servidor",
    );
    await user.click(screen.getByRole("button", { name: "Agregar" }));

    expect(onCreate).toHaveBeenCalledWith("Hermano servidor", []);
  });

  it("brings the usual permissions of a common name", async () => {
    const { user, onCreate } = setup();

    await user.type(
      screen.getByRole("combobox", { name: "Nuevo cargo" }),
      "Catequista",
    );
    expect(screen.getByText(/Se creará con 1 permiso/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Agregar" }));

    expect(onCreate).toHaveBeenCalledWith("Catequista", ["events.read"]);
  });

  it("copies the permissions of an existing position", async () => {
    const { user, onCreate } = setup();

    await user.type(
      screen.getByRole("combobox", { name: "Nuevo cargo" }),
      "Copastor",
    );
    await user.click(
      screen.getByRole("combobox", { name: "Copiar permisos de" }),
    );
    await user.click(screen.getByRole("option", { name: "Pastor" }));
    await user.click(screen.getByRole("button", { name: "Agregar" }));

    expect(onCreate).toHaveBeenCalledWith("Copastor", [
      "members.read",
      "members.write",
    ]);
  });

  it("only suggests names the church does not have yet", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("combobox", { name: "Nuevo cargo" }));

    expect(
      screen.getByRole("option", { name: "Catequista" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Pastor" }),
    ).not.toBeInTheDocument();
  });

  it("renames a position", async () => {
    const { user, onRename } = setup();

    await user.click(screen.getByRole("button", { name: "Renombrar Ujier" }));
    const field = screen.getByRole("textbox", { name: "Nombre" });
    await user.clear(field);
    await user.type(field, "Servidor");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(onRename).toHaveBeenCalledWith("p2", "Servidor");
  });

  it("deletes a position nobody depends on after confirming", async () => {
    const { user, onDelete } = setup();

    await user.click(screen.getByRole("button", { name: "Eliminar Ujier" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(onDelete).toHaveBeenCalledWith("p2");
  });

  it("warns that deleting a position that gives access takes it from people with an account", async () => {
    const { user, onDelete } = setup();

    await user.click(screen.getByRole("button", { name: "Eliminar Pastor" }));

    expect(
      screen.getByText(/1 persona con cuenta tiene el cargo Pastor.*perderán/),
    ).toBeInTheDocument();
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Eliminar",
      }),
    );
    expect(onDelete).toHaveBeenCalledWith("p1");
  });

  it("is read-only without permission", async () => {
    const { user } = setup(false);

    expect(screen.getByText("Pastor")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Agregar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /renombrar/i }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Abrir Pastor" }));
    expect(
      screen.getByRole("checkbox", { name: "Crear y editar personas" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: "Guardar permisos" }),
    ).not.toBeInTheDocument();
  });
});
