import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  EventRegistrationResponse,
  EventRegistrationSetupResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import {
  RegistrationPanelView,
  type RegistrationActions,
} from "./RegistrationPanelView";

afterEach(cleanup);

const setup: EventRegistrationSetupResponse = {
  enabled: true,
  open: true,
  confirmed: 2,
  waitlisted: 1,
  checkedIn: 1,
  tickets: [
    { id: "t1", name: "General", priceCents: 0, quantity: 10, sold: 2 },
    { id: "t2", name: "VIP", priceCents: 2500, sold: 0 },
  ],
};

const registrations: EventRegistrationResponse[] = [
  {
    id: "r1",
    firstName: "Lucía",
    lastName: "Mora",
    email: "lucia@x.org",
    phoneNumber: "999",
    ticketName: "General",
    status: "CONFIRMED",
    checkedInAt: new Date(2026, 2, 1, 10, 5),
  },
  {
    id: "r2",
    firstName: "Ana",
    lastName: "Paz",
    email: "ana@x.org",
    ticketName: "General",
    status: "CONFIRMED",
  },
  {
    id: "r3",
    firstName: "Eva",
    lastName: "Sol",
    email: "eva@x.org",
    ticketName: "VIP",
    status: "WAITLISTED",
  },
];

const setupView = (
  props: {
    setup?: EventRegistrationSetupResponse;
    registrations?: EventRegistrationResponse[];
    can?: Partial<RegistrationActions>;
  } = {},
) => {
  const handlers = {
    onConfigure: vi.fn(),
    onSetOpen: vi.fn().mockResolvedValue(undefined),
    onCheckIn: vi.fn().mockResolvedValue(undefined),
    onRemove: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <RegistrationPanelView
      setup={props.setup ?? setup}
      registrations={props.registrations ?? registrations}
      can={{
        configure: true,
        close: true,
        remove: true,
        checkIn: true,
        ...props.can,
      }}
      {...handlers}
    />,
  );
  return { ...handlers, user: userEvent.setup() };
};

describe("RegistrationPanelView", () => {
  it("offers to turn on the registration when the event has none", async () => {
    const { onConfigure, user } = setupView({ setup: { enabled: false } });

    expect(
      screen.getByText(
        "Este evento no pide inscripción: cualquiera puede venir.",
      ),
    ).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Activar inscripción" }),
    );

    expect(onConfigure).toHaveBeenCalledOnce();
    expect(screen.queryByRole("table", { name: "Inscritos" })).toBeNull();
  });

  it("summarizes the setup, the tickets and what each has sold", () => {
    setupView();

    expect(screen.getByText("Abierta")).toBeTruthy();
    expect(screen.getByText("Confirmados: 2")).toBeTruthy();
    expect(screen.getByText("En espera: 1")).toBeTruthy();
    expect(screen.getByText("Ingresaron: 1")).toBeTruthy();
    expect(screen.queryByText(/Cupo total/)).toBeNull();
    const tickets = screen.getByRole("table", { name: "Tickets" });
    expect(within(tickets).getByText("2 de 10")).toBeTruthy();
    expect(within(tickets).getByText("S/ 25.00")).toBeTruthy();
    expect(within(tickets).getByText("Gratis")).toBeTruthy();
  });

  it("lists who signed up with their ticket, state and whether they came", () => {
    setupView();

    const table = screen.getByRole("table", { name: "Inscritos" });
    const lucia = within(table).getByRole("row", { name: /Lucía Mora/ });
    expect(within(lucia).getByText("lucia@x.org · 999")).toBeTruthy();
    expect(within(lucia).getByText(/Ingresó a las/)).toBeTruthy();
    expect(
      within(within(table).getByRole("row", { name: /Ana Paz/ })).getByText(
        "Aún no",
      ),
    ).toBeTruthy();
    const eva = within(table).getByRole("row", { name: /Eva Sol/ });
    expect(within(eva).getByText("En espera")).toBeTruthy();
    expect(within(eva).getByText("—")).toBeTruthy();
  });

  it("marks who came, takes the mark back and removes a sign-up", async () => {
    const { onCheckIn, onRemove, user } = setupView();

    await user.click(
      screen.getByRole("button", { name: "Marcar el ingreso de Ana Paz" }),
    );
    expect(onCheckIn).toHaveBeenCalledWith("r2", true);
    await user.click(
      screen.getByRole("button", { name: "Quitar el ingreso de Lucía Mora" }),
    );
    expect(onCheckIn).toHaveBeenCalledWith("r1", false);
    await user.click(
      screen.getByRole("button", { name: "Quitar la inscripción de Eva Sol" }),
    );
    expect(onRemove).toHaveBeenCalledWith("r3");
  });

  it("does not offer to check in someone who waits", () => {
    setupView();

    expect(
      screen.queryByRole("button", { name: "Marcar el ingreso de Eva Sol" }),
    ).toBeNull();
  });

  it("hides the check-in buttons from who cannot take attendance", () => {
    setupView({ can: { checkIn: false } });

    expect(screen.queryByRole("button", { name: /el ingreso de/ })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Quitar la inscripción de Ana Paz" }),
    ).toBeTruthy();
  });

  it("says when nobody has signed up and when it is closed", () => {
    setupView({ registrations: [], setup: { ...setup, open: false } });

    expect(screen.getByText("Aún no hay inscritos.")).toBeTruthy();
    expect(screen.getByText("Cerrada")).toBeTruthy();
    expect(
      screen.getByText(
        "Las inscripciones están cerradas: nadie más puede anotarse.",
      ),
    ).toBeTruthy();
  });

  it("closes the registration with its own button and reopens it", async () => {
    const closed = setupView();
    await closed.user.click(
      screen.getByRole("button", { name: "Cerrar inscripciones" }),
    );
    expect(closed.onSetOpen).toHaveBeenCalledWith(false);
    cleanup();

    const reopened = setupView({ setup: { ...setup, open: false } });
    await reopened.user.click(
      screen.getByRole("button", { name: "Reabrir inscripciones" }),
    );
    expect(reopened.onSetOpen).toHaveBeenCalledWith(true);
  });

  it("blocks the button while the API answers and survives a refusal", async () => {
    let finish: () => void = () => undefined;
    const { onSetOpen, user } = setupView();
    onSetOpen.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          finish = () => reject(new Error("500"));
        }),
    );

    await user.click(
      screen.getByRole("button", { name: "Cerrar inscripciones" }),
    );
    expect(
      screen
        .getByRole("button", { name: "Cerrar inscripciones" })
        .hasAttribute("disabled"),
    ).toBe(true);
    finish();

    expect(
      await screen.findByRole("button", { name: "Cerrar inscripciones" }),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Cerrar inscripciones" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  it("each action shows only to who has its permission", () => {
    setupView({
      can: { configure: false, close: false, remove: false, checkIn: false },
    });

    expect(
      screen.queryByRole("button", { name: "Configurar inscripción" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Cerrar inscripciones" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Quitar la inscripción/ }),
    ).toBeNull();
    expect(screen.getByRole("table", { name: "Inscritos" })).toBeTruthy();
  });

  it("who can only close does not get the setup button, and vice versa", () => {
    setupView({ can: { configure: false } });
    expect(
      screen.queryByRole("button", { name: "Configurar inscripción" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Cerrar inscripciones" }),
    ).toBeTruthy();
    cleanup();

    setupView({ can: { close: false } });
    expect(
      screen.queryByRole("button", { name: "Cerrar inscripciones" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: "Configurar inscripción" }),
    ).toBeTruthy();
  });
});
