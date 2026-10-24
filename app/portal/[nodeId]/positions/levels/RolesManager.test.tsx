import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RolesManager } from "./RolesManager";

afterEach(cleanup);

const roles = [
  {
    id: "r1",
    name: "Colaborador",
    permissions: ["org.read", "members.read"],
    predefined: true,
  },
  {
    id: "r2",
    name: "Tesorero",
    description: "Finanzas",
    permissions: ["org.read"],
    predefined: false,
  },
];
const catalog = [
  { resource: "org", permissions: ["org.read", "org.update"] },
  { resource: "members", permissions: ["members.read", "members.write"] },
];

const setup = (canManage = true) => {
  const handlers = {
    onCreate: vi.fn().mockResolvedValue(undefined),
    onUpdate: vi.fn().mockResolvedValue(undefined),
    onDelete: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <RolesManager
      roles={roles}
      catalog={catalog}
      canManage={canManage}
      {...handlers}
    />,
  );
  return { user: userEvent.setup(), ...handlers };
};

describe("RolesManager", () => {
  it("shows predefined levels without edit or delete buttons", () => {
    setup();

    expect(screen.getByText("Predefinido")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Editar Colaborador" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Editar Tesorero" }),
    ).toBeInTheDocument();
  });

  it("lists each level with its permissions worded for any node", () => {
    setup();

    expect(
      screen.getByText(
        "Ver los datos de la iglesia, sede, grupo o ministerio, Ver personas",
      ),
    ).toBeInTheDocument();
  });

  it("creates a level from scratch with the chosen permissions", async () => {
    const { user, onCreate } = setup();

    await user.click(screen.getByRole("button", { name: "Nuevo nivel" }));
    const save = screen.getByRole("button", { name: "Guardar" });
    expect(save).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "Nombre" }), " Media ");
    await user.click(
      screen.getByRole("checkbox", {
        name: /^Editar nombre, dirección, teléfono y redes de la iglesia, sede, grupo o ministerio$/,
      }),
    );
    await user.click(save);

    expect(onCreate).toHaveBeenCalledWith({
      name: "Media",
      description: "",
      permissions: ["org.update"],
    });
  });

  it("starts from a predefined level and lets you adjust it", async () => {
    const { user, onCreate } = setup();

    await user.click(screen.getByRole("button", { name: "Nuevo nivel" }));
    await user.click(
      screen.getByRole("combobox", { name: "Crear a partir de" }),
    );
    await user.click(screen.getByRole("option", { name: "Colaborador" }));
    expect(
      screen.getByRole("checkbox", { name: "Ver personas" }),
    ).toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: "Ver personas" }));
    await user.type(screen.getByRole("textbox", { name: "Nombre" }), "Lector");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(onCreate).toHaveBeenCalledWith({
      name: "Lector",
      description: "",
      permissions: ["org.read"],
    });
  });

  it("selects a whole resource group at once", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: "Nuevo nivel" }));
    const group = screen.getByRole("group", { name: "Personas" });
    await user.click(within(group).getByRole("checkbox", { name: "Personas" }));

    expect(
      within(group).getByRole("checkbox", { name: "Ver personas" }),
    ).toBeChecked();
    expect(
      within(group).getByRole("checkbox", { name: "Crear y editar personas" }),
    ).toBeChecked();
  });

  it("edits an existing level", async () => {
    const { user, onUpdate } = setup();

    await user.click(screen.getByRole("button", { name: "Editar Tesorero" }));
    expect(
      screen.queryByRole("combobox", { name: "Crear a partir de" }),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("checkbox", {
        name: /^Editar nombre, dirección, teléfono y redes de la iglesia, sede, grupo o ministerio$/,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(onUpdate).toHaveBeenCalledWith("r2", {
      name: "Tesorero",
      description: "Finanzas",
      permissions: ["org.read", "org.update"],
    });
  });

  it("deletes a custom level after confirming", async () => {
    const { user, onDelete } = setup();

    await user.click(screen.getByRole("button", { name: "Eliminar Tesorero" }));
    await user.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(onDelete).toHaveBeenCalledWith("r2");
  });

  it("hides the editing controls without iam.manage", () => {
    setup(false);

    expect(
      screen.queryByRole("button", { name: "Nuevo nivel" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Editar Tesorero" }),
    ).not.toBeInTheDocument();
  });
});
