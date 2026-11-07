import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AddVisitorDialog } from "./AddVisitorDialog";

afterEach(cleanup);

const setup = (onAdd = () => Promise.resolve()) => {
  const add = vi.fn(onAdd);
  const close = vi.fn();
  render(<AddVisitorDialog onAdd={add} close={close} />);
  return { add, close, user: userEvent.setup() };
};

describe("AddVisitorDialog", () => {
  it("adds a visitor with only the first name and closes", async () => {
    const { add, close, user } = setup();

    await user.type(screen.getByLabelText(/Nombre del visitante/), "Rosa");
    await user.click(screen.getByRole("button", { name: "Agregar visitante" }));

    expect(add).toHaveBeenCalledWith({
      firstName: "Rosa",
      lastName: "",
      phoneNumber: "",
      email: "",
    });
    expect(close).toHaveBeenCalled();
  });

  it("sends the optional data when it is given", async () => {
    const { add, user } = setup();

    await user.type(screen.getByLabelText(/Nombre del visitante/), "Rosa");
    await user.type(screen.getByLabelText("Apellido del visitante"), "Díaz");
    await user.type(screen.getByLabelText("Teléfono del visitante"), "999");
    await user.type(screen.getByLabelText("Correo del visitante"), "r@x.org");
    await user.click(screen.getByRole("button", { name: "Agregar visitante" }));

    expect(add).toHaveBeenCalledWith({
      firstName: "Rosa",
      lastName: "Díaz",
      phoneNumber: "999",
      email: "r@x.org",
    });
  });

  it("asks for the name and a valid email instead of sending", async () => {
    const { add, user } = setup();

    await user.type(screen.getByLabelText("Correo del visitante"), "no");
    await user.click(screen.getByRole("button", { name: "Agregar visitante" }));

    expect(add).not.toHaveBeenCalled();
    expect(screen.getByText("Ingrese el nombre")).toBeInTheDocument();
    expect(screen.getByText("Ingrese un correo válido")).toBeInTheDocument();
  });

  it("stays open with what was typed when adding fails", async () => {
    const { close, user } = setup(() => Promise.reject(new Error("no")));

    await user.type(screen.getByLabelText(/Nombre del visitante/), "Rosa");
    await user.click(screen.getByRole("button", { name: "Agregar visitante" }));

    expect(close).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Nombre del visitante/)).toHaveValue("Rosa");
  });

  it("closes without adding on Cancelar", async () => {
    const { add, close, user } = setup();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(close).toHaveBeenCalled();
    expect(add).not.toHaveBeenCalled();
  });
});
