import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  ProvisionTemplatesResponse,
  WhatsAppConnectionResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { ChurchWhatsAppCard } from "./ChurchWhatsAppCard";

afterEach(cleanup);

const renderCard = (
  connection: WhatsAppConnectionResponse,
  handlers: {
    onConnect?: (mode: string) => Promise<void>;
    onDisconnect?: () => Promise<void>;
    onSubmitTemplates?: () => Promise<ProvisionTemplatesResponse | undefined>;
  } = {},
) => {
  const onConnect = vi.fn(handlers.onConnect ?? (async () => undefined));
  const onDisconnect = vi.fn(handlers.onDisconnect ?? (async () => undefined));
  const onSubmitTemplates = vi.fn(
    handlers.onSubmitTemplates ?? (async () => ({ templates: [] })),
  );
  render(
    <ChurchWhatsAppCard
      connection={connection}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      onSubmitTemplates={onSubmitTemplates}
    />,
  );
  return { onConnect, onDisconnect, onSubmitTemplates };
};

describe("ChurchWhatsAppCard", () => {
  it("offers to connect a church without WhatsApp, keeping the app by default", async () => {
    const user = userEvent.setup();
    const { onConnect } = renderCard({ status: "NOT_CONNECTED" });

    expect(screen.getByText("Sin conectar")).toBeTruthy();
    expect(
      (
        screen.getByRole("radio", {
          name: /Seguir usando la app de WhatsApp Business/,
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);

    await user.click(screen.getByRole("button", { name: "Conectar WhatsApp" }));

    expect(onConnect).toHaveBeenCalledWith("COEXISTENCE");
  });

  it("connects in the mode the pastor chooses", async () => {
    const user = userEvent.setup();
    const { onConnect } = renderCard({ status: "NOT_CONNECTED" });

    await user.click(
      screen.getByRole("radio", { name: /Solo para el asistente/ }),
    );
    await user.click(screen.getByRole("button", { name: "Conectar WhatsApp" }));

    expect(onConnect).toHaveBeenCalledWith("DEDICATED");
  });

  it("is blocked while the link is being made", async () => {
    const user = userEvent.setup();
    let finish: () => void = () => undefined;
    const { onConnect } = renderCard(
      { status: "NOT_CONNECTED" },
      { onConnect: () => new Promise<void>((resolve) => (finish = resolve)) },
    );

    const button = screen.getByRole("button", { name: "Conectar WhatsApp" });
    await user.click(button);

    expect(onConnect).toHaveBeenCalledTimes(1);
    expect((button as HTMLButtonElement).disabled).toBe(true);
    finish();
    await waitFor(() =>
      expect((button as HTMLButtonElement).disabled).toBe(false),
    );
  });

  it("says a pending connection is pending and still lets the pastor try again", () => {
    renderCard({ status: "PENDING", mode: "DEDICATED" });

    expect(screen.getByText("Conexión pendiente")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Conectar WhatsApp" }),
    ).toBeTruthy();
  });

  it("shows the connected number and asks before disconnecting", async () => {
    const user = userEvent.setup();
    const { onDisconnect } = renderCard({
      status: "CONNECTED",
      displayNumber: "+51 999 888 777",
    });

    expect(screen.getByText("Conectado")).toBeTruthy();
    expect(screen.getByText("+51 999 888 777")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Conectar WhatsApp" }),
    ).toBeNull();

    await user.click(screen.getByRole("button", { name: "Desconectar" }));
    expect(onDisconnect).not.toHaveBeenCalled();
    expect(
      screen.getByText("¿Desconectar el WhatsApp de la iglesia?"),
    ).toBeTruthy();

    const confirm = screen
      .getAllByRole("button", { name: "Desconectar" })
      .at(-1);
    await user.click(confirm as HTMLElement);

    await waitFor(() => expect(onDisconnect).toHaveBeenCalledTimes(1));
  });

  it("does not disconnect when the pastor cancels", async () => {
    const user = userEvent.setup();
    const { onDisconnect } = renderCard({ status: "CONNECTED" });

    await user.click(screen.getByRole("button", { name: "Desconectar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onDisconnect).not.toHaveBeenCalled();
  });

  it("a branch uses the church's number and cannot connect or cut it", () => {
    renderCard({
      status: "CONNECTED",
      displayNumber: "+51 1",
      inherited: true,
    });

    expect(screen.getByText(/esta sede lo usa/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Desconectar" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Conectar WhatsApp" }),
    ).toBeNull();
  });

  it("sends the templates to Meta and says what happened with each", async () => {
    const user = userEvent.setup();
    const { onSubmitTemplates } = renderCard(
      { status: "CONNECTED", displayNumber: "+51 1" },
      {
        onSubmitTemplates: async () => ({
          templates: [
            { name: "event_reminder", submitted: true },
            { name: "welcome", submitted: false, detail: "ya existe" },
          ],
        }),
      },
    );

    await user.click(
      screen.getByRole("button", { name: "Enviar plantillas a Meta" }),
    );

    expect(onSubmitTemplates).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText(/«event_reminder» enviada a Meta/),
    ).toBeTruthy();
    expect(screen.getByText(/«welcome» no se envió: ya existe/)).toBeTruthy();
  });

  it("shows nothing about templates when they could not be sent", async () => {
    const user = userEvent.setup();
    const { onSubmitTemplates } = renderCard(
      { status: "CONNECTED" },
      { onSubmitTemplates: async () => undefined },
    );

    await user.click(
      screen.getByRole("button", { name: "Enviar plantillas a Meta" }),
    );

    await waitFor(() => expect(onSubmitTemplates).toHaveBeenCalled());
    expect(screen.queryByText(/enviada a Meta/)).toBeNull();
  });

  it("offers no templates before the number is connected, nor to a branch", () => {
    renderCard({ status: "NOT_CONNECTED" });
    expect(
      screen.queryByRole("button", { name: "Enviar plantillas a Meta" }),
    ).toBeNull();
    cleanup();

    renderCard({ status: "CONNECTED", inherited: true });
    expect(
      screen.queryByRole("button", { name: "Enviar plantillas a Meta" }),
    ).toBeNull();
  });
});
