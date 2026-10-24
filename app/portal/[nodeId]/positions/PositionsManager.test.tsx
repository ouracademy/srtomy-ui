import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PositionsManager } from "./PositionsManager";

afterEach(cleanup);

const levels = [
  { id: "l-owner", name: "Propietario", assignable: false },
  { id: "l-admin", name: "Administrador", assignable: true },
  { id: "l-collab", name: "Colaborador", assignable: true },
];

const positions = [
  { id: "p1", name: "Pastor", accessRoleId: "l-admin", holders: 2 },
  { id: "p2", name: "Ujier", holders: 0 },
  { id: "p3", name: "Tesorero", accessRoleId: "l-collab", holders: 0 },
];

const setup = (
  canManage = true,
  levelsHref: string | undefined = undefined,
) => {
  const handlers = {
    onCreate: vi.fn().mockResolvedValue(undefined),
    onRename: vi.fn().mockResolvedValue(undefined),
    onSetAccess: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <PositionsManager
      positions={positions}
      levels={levels}
      suggestions={[
        { name: "Pastor", suggestedRoleId: "l-admin" },
        { name: "Catequista", suggestedRoleId: "l-collab" },
        { name: "Intercesor" },
      ]}
      canManage={canManage}
      levelsHref={levelsHref}
      {...handlers}
    />,
  );
  return { user: userEvent.setup(), ...handlers };
};

const levelSelect = (position: string) =>
  screen.getByRole("combobox", { name: `Nivel de acceso de ${position}` });

describe("PositionsManager", () => {
  it("shows each position with its level and how many people hold it", () => {
    setup();

    expect(levelSelect("Pastor")).toHaveTextContent("Administrador");
    expect(levelSelect("Ujier")).toHaveTextContent("Sin acceso a la app");
    expect(screen.getByRole("row", { name: /Pastor.*2/ })).toBeInTheDocument();
  });

  it("adds a position with any wording and no level", async () => {
    const { user, onCreate } = setup();

    await user.type(
      screen.getByRole("combobox", { name: "Nuevo cargo" }),
      "Hermano servidor",
    );
    await user.click(screen.getByRole("button", { name: "Agregar" }));

    expect(onCreate).toHaveBeenCalledWith("Hermano servidor", undefined);
  });

  it("proposes the usual level for a common name", async () => {
    const { user, onCreate } = setup();

    await user.type(
      screen.getByRole("combobox", { name: "Nuevo cargo" }),
      "Catequista",
    );
    expect(
      screen.getByRole("combobox", {
        name: "Nivel de acceso del nuevo cargo",
      }),
    ).toHaveTextContent("Colaborador");
    await user.click(screen.getByRole("button", { name: "Agregar" }));

    expect(onCreate).toHaveBeenCalledWith("Catequista", "l-collab");
  });

  it("never offers Owner as a level", async () => {
    const { user } = setup();

    await user.click(levelSelect("Ujier"));

    expect(
      screen.queryByRole("option", { name: "Propietario" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Administrador" }),
    ).toBeInTheDocument();
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

  it("sets the level of a position nobody holds at once", async () => {
    const { user, onSetAccess } = setup();

    await user.click(levelSelect("Ujier"));
    await user.click(screen.getByRole("option", { name: "Colaborador" }));

    expect(onSetAccess).toHaveBeenCalledWith("p2", "l-collab");
  });

  it("removes the level with the plain-label option", async () => {
    const { user, onSetAccess } = setup();

    await user.click(levelSelect("Tesorero"));
    await user.click(
      screen.getByRole("option", { name: "Sin acceso a la app" }),
    );

    expect(onSetAccess).toHaveBeenCalledWith("p3", undefined);
  });

  it("warns before changing the level of a position people hold", async () => {
    const { user, onSetAccess } = setup();

    await user.click(levelSelect("Pastor"));
    await user.click(screen.getByRole("option", { name: "Colaborador" }));

    expect(onSetAccess).not.toHaveBeenCalled();
    expect(
      screen.getByText(/2 personas tienen el cargo Pastor/),
    ).toHaveTextContent("«Administrador» a «Colaborador»");
    await user.click(screen.getByRole("button", { name: "Cambiar nivel" }));
    expect(onSetAccess).toHaveBeenCalledWith("p1", "l-collab");
  });

  it("keeps the level when the change is cancelled", async () => {
    const { user, onSetAccess } = setup();

    await user.click(levelSelect("Pastor"));
    await user.click(screen.getByRole("option", { name: "Colaborador" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onSetAccess).not.toHaveBeenCalled();
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

  it("warns that deleting a position with holders and access removes it", async () => {
    const { user, onDelete } = setup();

    await user.click(screen.getByRole("button", { name: "Eliminar Pastor" }));

    expect(
      screen.getByText(/2 personas tienen el cargo Pastor, que da acceso/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    expect(onDelete).toHaveBeenCalledWith("p1");
  });

  it("links to the custom levels only when given", () => {
    setup(true, "/portal/n1/positions/levels");

    expect(
      screen.getByRole("link", { name: "Niveles de acceso personalizados" }),
    ).toHaveAttribute("href", "/portal/n1/positions/levels");
  });

  it("is read-only without permission", () => {
    setup(false);

    expect(screen.getByText("Pastor")).toBeInTheDocument();
    expect(screen.getByText("Administrador")).toBeInTheDocument();
    expect(
      screen.queryByRole("combobox", { name: /nivel de acceso de pastor/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Agregar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /renombrar/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /niveles de acceso/i }),
    ).not.toBeInTheDocument();
  });
});
