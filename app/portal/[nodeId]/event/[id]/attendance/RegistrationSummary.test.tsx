import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EventRegistrationSetupResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { RegistrationSummary } from "./RegistrationSummary";
import type { RegistrationActions } from "./useRegistration";

const reg = vi.hoisted(() => ({
  state: {} as Record<string, unknown>,
  setOpen: vi.fn(),
  retry: vi.fn(),
}));
vi.mock("./useRegistration", () => ({
  useRegistration: () => ({
    save: vi.fn(),
    setOpen: reg.setOpen,
    retry: reg.retry,
    registrations: [],
    ...reg.state,
  }),
}));
vi.mock("./RegistrationSetupDialog", () => ({
  RegistrationSetupDialog: () => <div role="dialog" aria-label="Configurar" />,
}));

const setup: EventRegistrationSetupResponse = {
  enabled: true,
  open: true,
  confirmed: 120,
  checkedIn: 40,
  tickets: [
    {
      id: "t1",
      name: "Pase completo",
      priceCents: 8000,
      currency: "PEN",
      quantity: 150,
      sold: 98,
    },
    { id: "t2", name: "Libre", priceCents: 0, sold: 3 },
  ],
};

beforeEach(() => {
  reg.state = { setup };
  reg.setOpen.mockReset().mockResolvedValue(undefined);
  reg.retry.mockReset();
});
afterEach(cleanup);

const can = (overrides: Partial<RegistrationActions> = {}) => ({
  configure: true,
  close: true,
  remove: true,
  checkIn: true,
  ...overrides,
});

const show = (overrides?: Partial<RegistrationActions>) => {
  render(
    <RegistrationSummary eventId="e1" title="Congreso" can={can(overrides)} />,
  );
  return userEvent.setup();
};

describe("RegistrationSummary", () => {
  it("summarizes whether it is open, who is confirmed and what each ticket sold", () => {
    show();

    const card = screen.getByRole("region", { name: "Inscripción" });
    expect(card).toHaveTextContent("Abierta");
    expect(card).toHaveTextContent("Confirmados120");
    expect(card).toHaveTextContent("Ingresaron40");
    expect(card).toHaveTextContent("Pase completo");
    expect(card).toHaveTextContent("98 de 150");
    expect(card).toHaveTextContent("Libre");
  });

  it("offers to turn the sign-up on when the event has none", async () => {
    reg.state = { setup: { enabled: false } };
    const user = show();

    expect(
      screen.getByText(
        "Este evento no pide inscripción: cualquiera puede venir.",
      ),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Activar inscripción" }),
    );

    expect(screen.getByRole("dialog", { name: "Configurar" })).toBeVisible();
    expect(screen.queryByText("Abierta")).toBeNull();
  });

  it("opens the setup from Configurar inscripción", async () => {
    const user = show();

    await user.click(
      screen.getByRole("button", { name: "Configurar inscripción" }),
    );

    expect(screen.getByRole("dialog", { name: "Configurar" })).toBeVisible();
  });

  it("closes the registration and reopens it", async () => {
    const user = show();
    await user.click(
      screen.getByRole("button", { name: "Cerrar inscripciones" }),
    );
    expect(reg.setOpen).toHaveBeenCalledWith(false);
    cleanup();

    reg.state = { setup: { ...setup, open: false } };
    const again = show();
    expect(screen.getByText("Cerrada")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Las inscripciones están cerradas: nadie más puede anotarse.",
      ),
    ).toBeInTheDocument();
    await again.click(
      screen.getByRole("button", { name: "Reabrir inscripciones" }),
    );
    expect(reg.setOpen).toHaveBeenCalledWith(true);
  });

  it("blocks the button while the API answers and survives a refusal", async () => {
    let finish: () => void = () => undefined;
    reg.setOpen.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          finish = () => reject(new Error("500"));
        }),
    );
    const user = show();

    await user.click(
      screen.getByRole("button", { name: "Cerrar inscripciones" }),
    );
    expect(
      screen.getByRole("button", { name: "Cerrar inscripciones" }),
    ).toBeDisabled();
    finish();

    expect(
      await screen.findByRole("button", { name: "Cerrar inscripciones" }),
    ).toBeEnabled();
  });

  it("each action shows only to who has its permission", () => {
    show({ configure: false, close: false });

    expect(
      screen.queryByRole("button", { name: "Configurar inscripción" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Cerrar inscripciones" }),
    ).toBeNull();
  });

  it("is loading while the API has not answered", () => {
    reg.state = { setup: undefined };
    show();

    expect(screen.queryByRole("region", { name: "Inscripción" })).toBeNull();
  });

  it("shows the failure, and not a spinner for ever, when the API refuses", async () => {
    reg.state = { setup: undefined, setupError: new Error("500") };
    const user = show();

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(screen.getByText("No se pudo cargar")).toBeInTheDocument();
    expect(reg.retry).toHaveBeenCalledOnce();
  });

  it("says the event was not found on a 404", () => {
    reg.state = {
      setup: undefined,
      setupError: new AxiosError(
        "Not Found",
        "ERR_BAD_REQUEST",
        undefined,
        undefined,
        {
          status: 404,
        } as never,
      ),
    };
    show();

    expect(screen.getByText("No encontrado")).toBeInTheDocument();
  });
});
