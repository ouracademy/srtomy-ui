import { cleanup, render, screen } from "@testing-library/react";
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

  it("turning it on asks only for the seats and a price", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    await turnOn(user);
    await user.type(screen.getByLabelText("Cupos"), "30");
    await user.type(screen.getByLabelText("Precio (S/)"), "15");

    expect(screen.getByText(/Solo informativo: no se cobra/)).toBeTruthy();
    expect(screen.queryByRole("group", { name: "Tipos de ticket" })).toBeNull();
    expect(
      screen.queryByRole("switch", { name: "Lista de espera" }),
    ).toBeNull();
    const value = onValue.mock.lastCall?.[0] as RegistrationFormData;
    expect(toSetupRequest(value)).toEqual({
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

  it("keeps the rest under More options, closed until asked for", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    await turnOn(user);

    expect(
      screen
        .getByRole("button", { name: "Más opciones" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
    await openMoreOptions(user);
    await user.click(screen.getByRole("switch", { name: "Solo con cuenta" }));

    expect(onValue.mock.lastCall?.[0]).toMatchObject({ requiresAccount: true });
    expect(
      screen.getByText(
        "Quien no tenga cuenta deberá crearla para inscribirse.",
      ),
    ).toBeTruthy();
  });

  it("several kinds of ticket replace the seats and the price", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    await turnOn(user);
    await user.type(screen.getByLabelText("Cupos"), "20");

    await openMoreOptions(user);
    await user.click(
      screen.getByRole("button", { name: "Usar varios tipos de ticket" }),
    );

    expect(screen.queryByLabelText("Cupos")).toBeNull();
    expect(
      (screen.getByLabelText("Nombre del ticket 1") as HTMLInputElement).value,
    ).toBe("General");
    expect(
      (screen.getByLabelText("Cupos del ticket 1") as HTMLInputElement).value,
    ).toBe("20");
    await user.click(
      screen.getByRole("button", { name: "Agregar tipo de ticket" }),
    );
    await user.type(screen.getByLabelText("Nombre del ticket 2"), "VIP");
    await user.type(screen.getByLabelText("Precio (S/) del ticket 2"), "25");

    const request = toSetupRequest(
      onValue.mock.lastCall?.[0] as RegistrationFormData,
    );
    expect(request?.tickets).toMatchObject([
      { name: "General", priceCents: 0, quantity: 20 },
      { name: "VIP", priceCents: 2500 },
    ]);
  });

  it("removes a ticket but never the last one", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={{
          ...noRegistration(),
          enabled: true,
          manyTickets: true,
          tickets: [ticket({ name: "Adulto" })],
        }}
      />,
    );
    expect(
      screen
        .getByRole("button", { name: "Quitar el ticket 1" })
        .hasAttribute("disabled"),
    ).toBe(true);
    await user.click(
      screen.getByRole("button", { name: "Agregar tipo de ticket" }),
    );

    await user.click(
      screen.getByRole("button", { name: "Quitar el ticket 2" }),
    );

    expect(screen.queryByLabelText("Nombre del ticket 2")).toBeNull();
  });

  it("does not let a ticket with sign-ups be removed", () => {
    render(
      <Harness
        heldTicketIds={["t2"]}
        initial={{
          ...noRegistration(),
          enabled: true,
          manyTickets: true,
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

  it("opens More options by itself when the registration already uses them", () => {
    render(
      <Harness
        initial={{
          ...noRegistration(),
          enabled: true,
          requiresAccount: true,
        }}
      />,
    );

    expect(
      screen
        .getByRole("button", { name: "Más opciones" })
        .getAttribute("aria-expanded"),
    ).toBe("true");
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
