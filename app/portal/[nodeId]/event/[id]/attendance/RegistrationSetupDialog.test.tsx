import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  EventRegistrationSetupRequest,
  EventRegistrationSetupResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { RegistrationSetupDialog } from "./RegistrationSetupDialog";

afterEach(cleanup);

const none: EventRegistrationSetupResponse = { enabled: false };

const withTickets: EventRegistrationSetupResponse = {
  enabled: true,
  open: true,
  waitlistEnabled: false,
  requiresAccount: false,
  capacity: 50,
  tickets: [
    { id: "t1", name: "General", priceCents: 0, quantity: 30, sold: 4 },
    { id: "t2", name: "VIP", priceCents: 2500, quantity: 10, sold: 0 },
  ],
};

const setup = (
  props: {
    setup?: EventRegistrationSetupResponse;
    onSave?: (request: EventRegistrationSetupRequest | null) => Promise<void>;
  } = {},
) => {
  const handlers = {
    onSave: vi.fn<
      (request: EventRegistrationSetupRequest | null) => Promise<void>
    >(props.onSave ?? (() => Promise.resolve())),
    close: vi.fn(),
  };
  render(
    <RegistrationSetupDialog
      open
      title="Curso de discipulado"
      setup={props.setup ?? none}
      {...handlers}
    />,
  );
  return { ...handlers, user: userEvent.setup() };
};

const guardar = () => screen.getByRole("button", { name: "Guardar" });

describe("RegistrationSetupDialog", () => {
  it("starts from what the event has and keeps Guardar off until something changes", () => {
    setup({ setup: withTickets });

    expect(
      screen.getByRole("dialog", {
        name: "Inscripción de «Curso de discipulado»",
      }),
    ).toBeTruthy();
    expect(
      (
        screen.getByRole("radio", {
          name: /Con tipos de ticket/,
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    expect(
      (screen.getByLabelText("Nombre del ticket 2") as HTMLInputElement).value,
    ).toBe("VIP");
    expect(guardar().hasAttribute("disabled")).toBe(true);
  });

  it("turns on a free registration with seats", async () => {
    const { onSave, close, user } = setup();

    await user.click(screen.getByRole("radio", { name: /^Gratis/ }));
    await user.type(screen.getByLabelText("Cupo total"), "40");
    await user.click(guardar());

    expect(onSave).toHaveBeenCalledWith({
      open: true,
      requiresAccount: false,
      waitlistEnabled: false,
      capacity: 40,
      tickets: [{ name: "General", priceCents: 0, currency: "PEN" }],
    });
    expect(close).toHaveBeenCalledOnce();
  });

  it("updates a ticket keeping its id so its sign-ups stay with it", async () => {
    const { onSave, user } = setup({ setup: withTickets });

    await user.clear(screen.getByLabelText("Cantidad del ticket 1"));
    await user.type(screen.getByLabelText("Cantidad del ticket 1"), "35");
    await user.click(guardar());

    const request = onSave.mock.calls[0]?.[0];
    expect(request?.tickets[0]).toMatchObject({ id: "t1", quantity: 35 });
    expect(request?.tickets[1]).toMatchObject({ id: "t2", priceCents: 2500 });
  });

  it("does not let a ticket with sign-ups be removed", () => {
    setup({ setup: withTickets });

    expect(
      screen
        .getByRole("button", { name: "Quitar el ticket 1" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen
        .getByRole("button", { name: "Quitar el ticket 2" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  it("asks the API to take the registration away when the user picks none", async () => {
    const { onSave, user } = setup({ setup: withTickets });

    await user.click(screen.getByRole("radio", { name: /Sin inscripción/ }));
    await user.click(guardar());

    expect(onSave).toHaveBeenCalledWith(null);
  });

  it("does not send an invalid setup and says why", async () => {
    const { onSave, user } = setup();

    await user.click(
      screen.getByRole("radio", { name: /Con tipos de ticket/ }),
    );
    await user.clear(screen.getByLabelText("Nombre del ticket 1"));
    await user.click(guardar());

    expect(screen.getByRole("alert").textContent).toContain(
      "Ticket 1: ingrese el nombre",
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("keeps what was typed and stays open when the API refuses", async () => {
    const { close, user } = setup({
      onSave: vi.fn().mockRejectedValue(new Error("400")),
    });

    await user.click(screen.getByRole("radio", { name: /^Gratis/ }));
    await user.type(screen.getByLabelText("Cupo total"), "40");
    await user.click(guardar());

    expect(close).not.toHaveBeenCalled();
    expect(
      (screen.getByLabelText("Cupo total") as HTMLInputElement).value,
    ).toBe("40");
    expect(guardar().hasAttribute("disabled")).toBe(false);
  });

  it("asks before throwing away unsaved changes", async () => {
    const { close, user } = setup();

    await user.click(screen.getByRole("radio", { name: /^Gratis/ }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByText("Tiene cambios sin guardar.")).toBeTruthy();
    expect(close).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Descartar" }));

    expect(close).toHaveBeenCalledOnce();
  });
});
