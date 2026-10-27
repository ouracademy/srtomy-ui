import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VisitorsPanel } from "./VisitorsPanel";

afterEach(cleanup);

const setup = (
  props: {
    guestCount?: number;
    onAddVisitor?: () => Promise<void>;
    onSaveGuests?: () => Promise<void>;
  } = {},
) => {
  const onAddVisitor = vi.fn(props.onAddVisitor ?? (() => Promise.resolve()));
  const onSaveGuests = vi.fn(props.onSaveGuests ?? (() => Promise.resolve()));
  const view = render(
    <VisitorsPanel
      guestCount={props.guestCount ?? 0}
      onAddVisitor={onAddVisitor}
      onSaveGuests={onSaveGuests}
    />,
  );
  return { onAddVisitor, onSaveGuests, view, user: userEvent.setup() };
};

describe("VisitorsPanel", () => {
  it("adds a visitor with only the first name and clears the form", async () => {
    const { onAddVisitor, user } = setup();

    await user.type(screen.getByLabelText(/Nombre del visitante/), "Rosa");
    await user.click(screen.getByRole("button", { name: "Agregar visitante" }));

    expect(onAddVisitor).toHaveBeenCalledWith({
      firstName: "Rosa",
      lastName: "",
      phoneNumber: "",
      email: "",
    });
    expect(
      (screen.getByLabelText(/Nombre del visitante/) as HTMLInputElement).value,
    ).toBe("");
  });

  it("sends the optional data when it is given", async () => {
    const { onAddVisitor, user } = setup();

    await user.type(screen.getByLabelText(/Nombre del visitante/), "Rosa");
    await user.type(screen.getByLabelText("Apellido del visitante"), "Díaz");
    await user.type(screen.getByLabelText("Teléfono del visitante"), "999");
    await user.type(
      screen.getByLabelText("Correo del visitante"),
      "rosa@x.org",
    );
    await user.click(screen.getByRole("button", { name: "Agregar visitante" }));

    expect(onAddVisitor).toHaveBeenCalledWith({
      firstName: "Rosa",
      lastName: "Díaz",
      phoneNumber: "999",
      email: "rosa@x.org",
    });
  });

  it("asks for the name and a valid email instead of sending", async () => {
    const { onAddVisitor, user } = setup();

    await user.type(screen.getByLabelText("Correo del visitante"), "no");
    await user.click(screen.getByRole("button", { name: "Agregar visitante" }));

    expect(screen.getByText("Ingrese el nombre")).toBeTruthy();
    expect(screen.getByText("Ingrese un correo válido")).toBeTruthy();
    expect(onAddVisitor).not.toHaveBeenCalled();
  });

  it("keeps what was typed when the API refuses", async () => {
    const { user } = setup({
      onAddVisitor: () => Promise.reject(new Error("400")),
    });

    await user.type(screen.getByLabelText(/Nombre del visitante/), "Rosa");
    await user.click(screen.getByRole("button", { name: "Agregar visitante" }));

    expect(
      (screen.getByLabelText(/Nombre del visitante/) as HTMLInputElement).value,
    ).toBe("Rosa");
  });

  it("counts the visitors without a name and only saves a changed number", async () => {
    const { onSaveGuests, user } = setup({ guestCount: 5 });
    const save = screen.getByRole("button", { name: "Guardar cantidad" });

    expect(save.hasAttribute("disabled")).toBe(true);
    await user.clear(screen.getByLabelText("Visitantes sin nombre"));
    await user.type(screen.getByLabelText("Visitantes sin nombre"), "8");
    await user.click(save);

    expect(onSaveGuests).toHaveBeenCalledWith(8);
  });

  it("does not accept a count that is not a whole number", async () => {
    const { onSaveGuests, user } = setup({ guestCount: 2 });

    await user.clear(screen.getByLabelText("Visitantes sin nombre"));
    await user.type(screen.getByLabelText("Visitantes sin nombre"), "-3");

    expect(
      screen
        .getByRole("button", { name: "Guardar cantidad" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(onSaveGuests).not.toHaveBeenCalled();
  });

  it("follows the count when people are counted from their phones", () => {
    const { view } = setup({ guestCount: 2 });

    view.rerender(
      <VisitorsPanel
        guestCount={4}
        onAddVisitor={vi.fn()}
        onSaveGuests={vi.fn()}
      />,
    );

    expect(
      (screen.getByLabelText("Visitantes sin nombre") as HTMLInputElement)
        .value,
    ).toBe("4");
  });
});
