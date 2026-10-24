import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateChurchForm } from "./CreateChurchForm";

const levels = [
  { id: "l-admin", name: "Administrador", assignable: true },
  { id: "l-leader", name: "Líder", assignable: true },
  { id: "l-collab", name: "Colaborador", assignable: true },
];

const mocks = vi.hoisted(() => ({ levels: undefined as unknown }));

vi.mock("@/app/(api)/generated", () => ({
  useGetIamLevels: () => ({ data: mocks.levels }),
  useGetPositionsSuggestions: () => ({
    data: [
      { name: "Diácono", suggestedRoleId: "l-leader" },
      { name: "Intercesor" },
    ],
  }),
}));

afterEach(() => {
  cleanup();
  mocks.levels = undefined;
});

const fillBasics = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(
    screen.getByRole("textbox", { name: /nombre de la iglesia/i }),
    "Iglesia Vida",
  );
  await user.type(screen.getByRole("textbox", { name: /sus nombres/i }), "Ana");
  await user.type(
    screen.getByRole("textbox", { name: /sus apellidos/i }),
    "Diaz",
  );
};

describe("CreateChurchForm", () => {
  it("waits for the access levels", () => {
    render(<CreateChurchForm submit={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: "Crear iglesia" }),
    ).not.toBeInTheDocument();
  });

  it("sends the church, its location, the positions with their level and the creator", async () => {
    mocks.levels = levels;
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<CreateChurchForm submit={submit} />);

    await fillBasics(user);
    const location = screen.getByRole("textbox", {
      name: /nombre de la sede/i,
    });
    await user.clear(location);
    await user.type(location, "Sede Centro");
    await user.click(
      screen.getByRole("button", { name: "Quitar cargo Maestro" }),
    );
    await user.click(screen.getByRole("button", { name: "Crear iglesia" }));

    expect(submit).toHaveBeenCalledTimes(1);
    const values = submit.mock.calls[0]?.[0];
    expect(values.name).toBe("Iglesia Vida");
    expect(values.location.name).toBe("Sede Centro");
    expect(values.positions).toEqual([
      { name: "Pastor", accessRoleId: "l-admin" },
      { name: "Líder de alabanza", accessRoleId: "l-leader" },
      { name: "Servidor", accessRoleId: "l-collab" },
    ]);
    expect(values.creator).toEqual({
      firstName: "Ana",
      lastName: "Diaz",
      positionName: "Pastor",
    });
  });

  it("lets the user change the level of a position", async () => {
    mocks.levels = levels;
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<CreateChurchForm submit={submit} />);

    await fillBasics(user);
    await user.click(
      screen.getByRole("combobox", { name: "Nivel de acceso del cargo 3" }),
    );
    await user.click(
      screen.getByRole("option", { name: "Sin acceso a la app" }),
    );
    await user.click(screen.getByRole("button", { name: "Crear iglesia" }));

    expect(submit.mock.calls[0]?.[0].positions[2]).toEqual({
      name: "Servidor",
      accessRoleId: "none",
    });
  });

  it("proposes the usual level when a suggested name is typed in a new row", async () => {
    mocks.levels = levels;
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<CreateChurchForm submit={submit} />);

    await fillBasics(user);
    await user.click(screen.getByRole("button", { name: "Agregar cargo" }));
    await user.type(
      screen.getByRole("combobox", { name: "Cargo 5" }),
      "Diácono",
    );
    await user.click(screen.getByRole("button", { name: "Crear iglesia" }));

    expect(submit.mock.calls[0]?.[0].positions[4]).toEqual({
      name: "Diácono",
      accessRoleId: "l-leader",
    });
  });

  it("does not submit without a church name or the creator's names", async () => {
    mocks.levels = levels;
    const user = userEvent.setup();
    const submit = vi.fn();
    render(<CreateChurchForm submit={submit} />);

    await user.click(screen.getByRole("button", { name: "Crear iglesia" }));

    expect(
      await screen.findByText("Ingrese el nombre de la iglesia"),
    ).toBeInTheDocument();
    expect(screen.getByText("Ingrese su nombre")).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });
});
