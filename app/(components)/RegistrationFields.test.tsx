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

describe("RegistrationFields", () => {
  it("starts without registration and shows nothing else", () => {
    render(<Harness />);

    expect(
      (
        screen.getByRole("radio", {
          name: /Sin inscripción/,
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
    expect(screen.queryByLabelText("Cupo total")).toBeNull();
    expect(screen.queryByRole("group", { name: "Tipos de ticket" })).toBeNull();
  });

  it("a free event asks only for the seats and the switches", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    await user.click(screen.getByRole("radio", { name: /^Gratis/ }));
    await user.type(screen.getByLabelText("Cupo total"), "30");
    await user.click(
      screen.getByRole("switch", {
        name: "Lista de espera cuando se agoten los lugares",
      }),
    );

    expect(screen.queryByRole("group", { name: "Tipos de ticket" })).toBeNull();
    const value = onValue.mock.lastCall?.[0] as RegistrationFormData;
    expect(toSetupRequest(value)).toMatchObject({
      capacity: 30,
      waitlistEnabled: true,
      open: true,
      requiresAccount: false,
      tickets: [{ name: "General", priceCents: 0 }],
    });
  });

  it("with tickets it starts with one called General and lets the user define it", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    await user.click(
      screen.getByRole("radio", { name: /Con tipos de ticket/ }),
    );
    expect(
      (screen.getByLabelText("Nombre del ticket 1") as HTMLInputElement).value,
    ).toBe("General");
    await user.type(screen.getByLabelText("Cantidad del ticket 1"), "20");
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
    render(<Harness />);
    await user.click(
      screen.getByRole("radio", { name: /Con tipos de ticket/ }),
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
          mode: "TICKETS",
          tickets: [
            {
              id: "t1",
              name: "General",
              price: "",
              quantity: "",
              salesStart: "",
              salesEnd: "",
            },
            {
              id: "t2",
              name: "VIP",
              price: "",
              quantity: "",
              salesStart: "",
              salesEnd: "",
            },
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

  it("says the price is informative and shows why it cannot be saved", async () => {
    const user = userEvent.setup();
    render(<Harness errors={["Ticket 1: ingrese el nombre"]} />);

    await user.click(
      screen.getByRole("radio", { name: /Con tipos de ticket/ }),
    );

    expect(screen.getByText(/Solo informativo: no se cobra\./)).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain(
      "Ticket 1: ingrese el nombre",
    );
  });

  it("closes the registration and asks for an account with the switches", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(
      <Harness
        initial={{ ...noRegistration(), mode: "FREE" }}
        onValue={onValue}
      />,
    );

    await user.click(
      screen.getByRole("switch", { name: "Inscripción abierta" }),
    );
    await user.click(
      screen.getByRole("switch", {
        name: "Pedir iniciar sesión para inscribirse",
      }),
    );

    expect(onValue.mock.lastCall?.[0]).toMatchObject({
      open: false,
      requiresAccount: true,
    });
  });
});
