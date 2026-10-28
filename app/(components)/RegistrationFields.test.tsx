import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RegistrationFields } from "./RegistrationFields";
import {
  noRegistration,
  toSetupRequest,
  type RegistrationFormData,
} from "./registration";

afterEach(cleanup);

// Holds the value like the screens do, so typing works.
const Harness = ({
  initial = noRegistration(),
  onValue,
  errors,
  heldTicketIds,
}: {
  initial?: RegistrationFormData;
  onValue?: (value: RegistrationFormData) => void;
  errors?: string[];
  heldTicketIds?: string[];
}) => {
  const [value, setValue] = React.useState(initial);
  return (
    <RegistrationFields
      value={value}
      errors={errors}
      heldTicketIds={heldTicketIds}
      onChange={(next) => {
        setValue(next);
        onValue?.(next);
      }}
    />
  );
};

const ticket = (change: Partial<RegistrationFormData["tickets"][number]>) => ({
  name: "",
  price: "",
  quantity: "",
  salesStart: "",
  salesEnd: "",
  ...change,
});

const turnOn = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("switch", { name: "Pedir inscripción" }));

const openMoreOptions = async (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: "Más opciones" }));

const ticketGroup = (position: number) =>
  within(screen.getByRole("group", { name: `Ticket ${position}` }));

describe("RegistrationFields", () => {
  it("starts without registration and shows nothing else", () => {
    render(<Harness />);

    expect(
      (
        screen.getByRole("switch", {
          name: "Pedir inscripción",
        }) as HTMLInputElement
      ).checked,
    ).toBe(false);
    expect(
      screen.getByText(/cualquiera puede venir sin anotarse/),
    ).toBeTruthy();
    expect(screen.queryByLabelText("Cupos")).toBeNull();
    expect(screen.queryByRole("button", { name: "Más opciones" })).toBeNull();
  });

  it("turning it on asks only for the seats and the price, without talking about tickets", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    await turnOn(user);

    expect((screen.getByLabelText("Cupos") as HTMLInputElement).value).toBe("");
    expect(
      (screen.getByLabelText("Precio (S/)") as HTMLInputElement).value,
    ).toBe("");
    expect(screen.getByText("Vacío es sin límite.")).toBeTruthy();
    expect(screen.getByText("Vacío es gratis.")).toBeTruthy();
    expect(screen.queryByLabelText("Nombre")).toBeNull();
    expect(screen.queryByText(/Ticket \d/)).toBeNull();
    expect(onValue.mock.lastCall?.[0]).toMatchObject({ enabled: true });
  });

  it("does not say the price is informative or that nothing is charged", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await turnOn(user);

    expect(screen.queryByText(/informativo/i)).toBeNull();
    expect(screen.queryByText(/no se cobra/i)).toBeNull();
    expect(screen.queryByText(/Opcional\./)).toBeNull();
  });

  it("the usual case is to say how many seats and what it costs", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    await turnOn(user);
    await user.type(screen.getByLabelText("Cupos"), "30");
    await user.type(screen.getByLabelText("Precio (S/)"), "15");

    expect(
      toSetupRequest(onValue.mock.lastCall?.[0] as RegistrationFormData),
    ).toEqual({
      requiresAccount: false,
      tickets: [
        expect.objectContaining({
          name: "General",
          priceCents: 1500,
          quantity: 30,
        }),
      ],
    });
  });

  it("another kind of ticket opens the list, whose labels do not repeat the number", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    await turnOn(user);
    await user.type(screen.getByLabelText("Cupos"), "30");

    await user.click(
      screen.getByRole("button", { name: "Agregar otro tipo de ticket" }),
    );

    // The seats typed are in the first ticket, now with its name.
    expect(
      (ticketGroup(1).getByLabelText("Nombre") as HTMLInputElement).value,
    ).toBe("General");
    expect(
      (ticketGroup(1).getByLabelText("Cupos") as HTMLInputElement).value,
    ).toBe("30");
    await user.type(ticketGroup(2).getByLabelText("Nombre"), "VIP");
    await user.type(ticketGroup(2).getByLabelText("Precio (S/)"), "25");
    expect(
      toSetupRequest(onValue.mock.lastCall?.[0] as RegistrationFormData)
        ?.tickets,
    ).toMatchObject([
      { name: "General", priceCents: 0, quantity: 30 },
      { name: "VIP", priceCents: 2500 },
    ]);
    // No label says "ticket 1" or "ticket 2": the groups tell them apart.
    expect(screen.queryByLabelText(/del ticket \d/)).toBeNull();
  });

  it("goes back to the short form when only General is left", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await turnOn(user);
    await user.click(
      screen.getByRole("button", { name: "Agregar otro tipo de ticket" }),
    );

    await user.click(
      screen.getByRole("button", { name: "Quitar el ticket 2" }),
    );

    expect(screen.queryByRole("group", { name: "Ticket 1" })).toBeNull();
    expect((screen.getByLabelText("Cupos") as HTMLInputElement).value).toBe("");
  });

  it("does not jump to the short form while a name is typed", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={{
          ...noRegistration(),
          enabled: true,
          tickets: [ticket({ name: "Adulto" })],
        }}
      />,
    );

    const name = ticketGroup(1).getByLabelText("Nombre");
    await user.clear(name);
    await user.type(name, "General");

    expect(ticketGroup(1).getByLabelText("Nombre")).toBeTruthy();
  });

  it("stays in the list when a ticket is not General", () => {
    render(
      <Harness
        initial={{
          ...noRegistration(),
          enabled: true,
          tickets: [ticket({ name: "VIP" })],
        }}
      />,
    );

    expect(screen.getByRole("group", { name: "Ticket 1" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Agregar otro/ })).toBeNull();
  });

  it("never removes the last ticket of the list", () => {
    render(
      <Harness
        initial={{
          ...noRegistration(),
          enabled: true,
          tickets: [ticket({ name: "VIP" })],
        }}
      />,
    );

    expect(
      screen
        .getByRole("button", { name: "Quitar el ticket 1" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  it("does not let a ticket with sign-ups be removed", () => {
    render(
      <Harness
        heldTicketIds={["t2"]}
        initial={{
          ...noRegistration(),
          enabled: true,
          tickets: [
            ticket({ id: "t1", name: "General" }),
            ticket({ id: "t2", name: "VIP" }),
          ],
        }}
      />,
    );

    expect(
      screen
        .getByRole("button", { name: "Quitar el ticket 1" })
        .hasAttribute("disabled"),
    ).toBe(false);
    expect(
      screen
        .getByRole("button", { name: "Quitar el ticket 2" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });

  it("the sales dates of the short form are under More options", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    await turnOn(user);

    // It is folded inside More options until that is opened.
    expect(screen.getByLabelText("Venta desde")).not.toBeVisible();
    await openMoreOptions(user);
    expect(screen.getByLabelText("Venta desde")).toBeVisible();
    await user.type(screen.getByLabelText("Venta desde"), "2026-03-01T09:00");

    expect(screen.getByLabelText("Venta hasta")).toBeVisible();
    expect(onValue.mock.lastCall?.[0]).toMatchObject({
      tickets: [{ salesStart: "2026-03-01T09:00" }],
    });
  });

  it("opens More options by itself when the registration already uses them", () => {
    render(
      <Harness
        initial={{
          ...noRegistration(),
          enabled: true,
          tickets: [
            ticket({ name: "General", salesStart: "2026-03-01T09:00" }),
          ],
        }}
      />,
    );

    expect(
      screen
        .getByRole("button", { name: "Más opciones" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
    expect(screen.getByLabelText("Venta desde")).toBeTruthy();
  });

  it("in the list each ticket keeps its sales dates folded until asked for", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={{
          ...noRegistration(),
          enabled: true,
          tickets: [ticket({ name: "Adulto" }), ticket({ name: "Niño" })],
        }}
      />,
    );

    expect(screen.queryByLabelText("Venta desde")).toBeNull();
    await user.click(
      within(screen.getByRole("group", { name: "Ticket 2" })).getByRole(
        "button",
        { name: "Fechas de venta" },
      ),
    );

    expect(ticketGroup(2).getByLabelText("Venta desde")).toBeTruthy();
    expect(ticketGroup(1).queryByLabelText("Venta desde")).toBeNull();
  });

  it("asks for an account with its own switch under More options", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    await turnOn(user);
    await openMoreOptions(user);

    await user.click(screen.getByRole("switch", { name: "Solo con cuenta" }));

    expect(onValue.mock.lastCall?.[0]).toMatchObject({ requiresAccount: true });
    expect(
      screen.getByText(
        "Quien no tenga cuenta deberá crearla para inscribirse.",
      ),
    ).toBeTruthy();
  });

  it("shows why it cannot be saved", async () => {
    const user = userEvent.setup();
    render(<Harness errors={["Inscripción: el precio no es válido"]} />);
    await turnOn(user);

    expect(screen.getByRole("alert").textContent).toContain(
      "Inscripción: el precio no es válido",
    );
  });

  it("has no switch to close the registration, which is an action of its own", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await turnOn(user);
    await openMoreOptions(user);

    expect(
      screen.queryByRole("switch", { name: "Inscripción abierta" }),
    ).toBeNull();
  });
});
