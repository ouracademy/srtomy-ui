import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateChurchForm } from "./CreateChurchForm";

const mocks = vi.hoisted(() => ({
  suggestions: undefined as unknown,
  catalog: undefined as unknown,
}));

vi.mock("@/app/(api)/generated", () => ({
  useGetPositionsSuggestions: () => ({ data: mocks.suggestions }),
  useGetIamPermissions: () => ({ data: mocks.catalog }),
}));

afterEach(() => {
  cleanup();
  mocks.suggestions = undefined;
  mocks.catalog = undefined;
});

const ready = () => {
  mocks.suggestions = [
    { name: "Pastor", permissions: ["org.read", "members.write"] },
    { name: "Servidor", permissions: ["org.read"] },
    { name: "Diácono", permissions: ["events.read"] },
  ];
  mocks.catalog = [
    { resource: "members", permissions: ["members.read", "members.write"] },
    { resource: "events", permissions: ["events.read"] },
  ];
};

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
  it("waits for the suggestions and the permissions", () => {
    render(<CreateChurchForm submit={vi.fn()} />);

    expect(
      screen.queryByRole("button", { name: "Crear iglesia" }),
    ).not.toBeInTheDocument();
  });

  it("sends the church, its location, the positions with their permissions and the creator", async () => {
    ready();
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
      { name: "Pastor", permissions: ["org.read", "members.write"] },
      { name: "Líder de alabanza", permissions: [] },
      { name: "Servidor", permissions: ["org.read"] },
    ]);
    expect(values.creator).toEqual({
      firstName: "Ana",
      lastName: "Diaz",
      positionName: "Pastor",
    });
  });

  it("lets the user change the permissions of a position", async () => {
    ready();
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<CreateChurchForm submit={submit} />);

    await fillBasics(user);
    await user.click(
      screen.getByRole("button", { name: "Permisos del cargo 2" }),
    );
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("checkbox", { name: "Ver eventos y cursos" }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Listo" }));
    await user.click(screen.getByRole("button", { name: "Crear iglesia" }));

    expect(submit.mock.calls[0]?.[0].positions[1]).toEqual({
      name: "Líder de alabanza",
      permissions: ["events.read"],
    });
  });

  it("brings the usual permissions when a suggested name is typed in a new row", async () => {
    ready();
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
      permissions: ["events.read"],
    });
  });

  it("proposes the creator's name, still editable and required", async () => {
    ready();
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(undefined);
    render(
      <CreateChurchForm
        submit={submit}
        creatorName={{ firstName: "Ana", lastName: "Díaz" }}
      />,
    );

    const first = screen.getByRole("textbox", { name: /sus nombres/i });
    expect(first).toHaveValue("Ana");
    expect(screen.getByRole("textbox", { name: /sus apellidos/i })).toHaveValue(
      "Díaz",
    );
    await user.clear(first);
    await user.click(screen.getByRole("button", { name: "Crear iglesia" }));

    expect(await screen.findByText("Ingrese su nombre")).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it("does not submit without a church name or the creator's names", async () => {
    ready();
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
