import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PositionsManager } from "./PositionsManager";

afterEach(cleanup);

const positions = [
  { id: "p1", name: "Pastor" },
  { id: "p2", name: "Ujier" },
];

const setup = (canManage = true) => {
  const handlers = {
    onCreate: vi.fn().mockResolvedValue(undefined),
    onRename: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <PositionsManager
      positions={positions}
      suggestions={["Pastor", "Catequista"]}
      canManage={canManage}
      {...handlers}
    />,
  );
  return { user: userEvent.setup(), ...handlers };
};

describe("PositionsManager", () => {
  it("adds a position with any wording", async () => {
    const { user, onCreate } = setup();

    await user.type(
      screen.getByRole("combobox", { name: "Nuevo cargo" }),
      "Hermano servidor",
    );
    await user.click(screen.getByRole("button", { name: "Agregar" }));

    expect(onCreate).toHaveBeenCalledWith("Hermano servidor");
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

  it("deletes a position after confirming", async () => {
    const { user, onDelete } = setup();

    await user.click(screen.getByRole("button", { name: "Eliminar Pastor" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(onDelete).toHaveBeenCalledWith("p1");
  });

  it("is read-only without permission", () => {
    setup(false);

    expect(screen.getByText("Pastor")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Agregar" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /renombrar/i }),
    ).not.toBeInTheDocument();
  });
});
