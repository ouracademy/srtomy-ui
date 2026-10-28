import { cleanup, render, screen, within } from "@testing-library/react";
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
  requiresAccount: false,
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
        screen.getByRole("switch", {
          name: "Pedir inscripción",
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    expect(
      (
        within(screen.getByRole("group", { name: "Ticket 2" })).getByLabelText(
          "Nombre",
        ) as HTMLInputElement
      ).value,
    ).toBe("VIP");
    expect(guardar().hasAttribute("disabled")).toBe(true);
  });

  it("turns on the registration with just the seats", async () => {
    const { onSave, close, user } = setup();

    await user.click(screen.getByRole("switch", { name: "Pedir inscripción" }));
    await user.type(screen.getByLabelText("Cupos"), "40");
    await user.click(guardar());

    expect(onSave).toHaveBeenCalledWith({
      requiresAccount: false,
      tickets: [
        {
          id: undefined,
          name: "General",
          priceCents: 0,
          currency: "PEN",
          quantity: 40,
          salesStart: undefined,
          salesEnd: undefined,
        },
      ],
    });
    expect(close).toHaveBeenCalledOnce();
  });

  it("updates a ticket keeping its id so its sign-ups stay with it", async () => {
    const { onSave, user } = setup({ setup: withTickets });

    const first = within(screen.getByRole("group", { name: "Ticket 1" }));
    await user.clear(first.getByLabelText("Cupos"));
    await user.type(first.getByLabelText("Cupos"), "35");
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

    await user.click(screen.getByRole("switch", { name: "Pedir inscripción" }));
    await user.click(guardar());

    expect(onSave).toHaveBeenCalledWith(null);
  });

  it("does not send an invalid setup and says why", async () => {
    const { onSave, user } = setup();

    await user.click(screen.getByRole("switch", { name: "Pedir inscripción" }));
    await user.type(screen.getByLabelText("Cupos"), "0");
    await user.click(guardar());

    expect(screen.getByRole("alert").textContent).toContain(
      "Inscripción: los cupos deben ser un número mayor que cero",
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  it("keeps what was typed and stays open when the API refuses", async () => {
    const { close, user } = setup({
      onSave: vi.fn().mockRejectedValue(new Error("400")),
    });

    await user.click(screen.getByRole("switch", { name: "Pedir inscripción" }));
    await user.type(screen.getByLabelText("Cupos"), "40");
    await user.click(guardar());

    expect(close).not.toHaveBeenCalled();
    expect((screen.getByLabelText("Cupos") as HTMLInputElement).value).toBe(
      "40",
    );
    expect(guardar().hasAttribute("disabled")).toBe(false);
  });

  it("asks before throwing away unsaved changes", async () => {
    const { close, user } = setup();

    await user.click(screen.getByRole("switch", { name: "Pedir inscripción" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.getByText("Tiene cambios sin guardar.")).toBeTruthy();
    expect(close).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Descartar" }));

    expect(close).toHaveBeenCalledOnce();
  });
});
