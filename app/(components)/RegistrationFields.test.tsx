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
    expect(screen.queryByLabelText("Nombre del ticket 1")).toBeNull();
    expect(
      screen.queryByRole("switch", { name: "Solo con cuenta" }),
    ).toBeNull();
  });

  it("turning it on shows the ticket General, free and without limit", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    await turnOn(user);

    expect(
      (screen.getByLabelText("Nombre del ticket 1") as HTMLInputElement).value,
    ).toBe("General");
    expect(
      (screen.getByLabelText("Precio (S/) del ticket 1") as HTMLInputElement)
        .value,
    ).toBe("");
    expect(screen.getByText("Vacío es gratis.")).toBeTruthy();
    expect(screen.getByText("Vacío es sin límite.")).toBeTruthy();
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

  it("the usual case is to say how many seats", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);

    await turnOn(user);
    await user.type(screen.getByLabelText("Cupos del ticket 1"), "30");
    await user.type(screen.getByLabelText("Precio (S/) del ticket 1"), "15");

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

  it("has no mode to switch: more tickets are just added to the list, and taken out again", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    await turnOn(user);

    expect(
      screen.queryByRole("button", { name: /varios tipos de ticket/ }),
    ).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Agregar tipo de ticket" }),
    );
    await user.type(screen.getByLabelText("Nombre del ticket 2"), "VIP");
    await user.type(screen.getByLabelText("Precio (S/) del ticket 2"), "25");
    expect(
      toSetupRequest(onValue.mock.lastCall?.[0] as RegistrationFormData)
        ?.tickets,
    ).toMatchObject([
      { name: "General", priceCents: 0 },
      { name: "VIP", priceCents: 2500 },
    ]);

    // Back to a single ticket: nothing else to undo.
    await user.click(
      screen.getByRole("button", { name: "Quitar el ticket 2" }),
    );
    expect(screen.queryByLabelText("Nombre del ticket 2")).toBeNull();
    expect(
      (screen.getByLabelText("Nombre del ticket 1") as HTMLInputElement).value,
    ).toBe("General");
  });

  it("never removes the last ticket", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await turnOn(user);

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

  it("keeps the sales dates folded until asked for, and open when the ticket has them", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Harness />);
    await turnOn(user);

    expect(screen.queryByLabelText("Venta desde (ticket 1)")).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Fechas de venta del ticket 1" }),
    );
    expect(screen.getByLabelText("Venta desde (ticket 1)")).toBeTruthy();
    expect(screen.getByLabelText("Venta hasta (ticket 1)")).toBeTruthy();
    unmount();

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
    expect(screen.getByLabelText("Venta desde (ticket 1)")).toBeTruthy();
  });

  it("asks for an account with its own switch", async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    render(<Harness onValue={onValue} />);
    await turnOn(user);

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
    render(<Harness errors={["Ticket 1: el precio no es válido"]} />);
    await turnOn(user);

    expect(screen.getByRole("alert").textContent).toContain(
      "Ticket 1: el precio no es válido",
    );
  });

  it("has no switch to close the registration, which is an action of its own", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await turnOn(user);

    expect(
      screen.queryByRole("switch", { name: "Inscripción abierta" }),
    ).toBeNull();
  });
});
