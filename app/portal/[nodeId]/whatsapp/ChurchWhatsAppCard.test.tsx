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
    onConnect?: () => Promise<void>;
    onDisconnect?: () => Promise<void>;
    onSetAgentPaused?: (paused: boolean) => Promise<void>;
    onSubmitTemplates?: () => Promise<ProvisionTemplatesResponse | undefined>;
  } = {},
) => {
  const onConnect = vi.fn(handlers.onConnect ?? (async () => undefined));
  const onDisconnect = vi.fn(handlers.onDisconnect ?? (async () => undefined));
  const onSetAgentPaused = vi.fn(
    handlers.onSetAgentPaused ?? (async () => undefined),
  );
  const onSubmitTemplates = vi.fn(
    handlers.onSubmitTemplates ?? (async () => ({ templates: [] })),
  );
  render(
    <ChurchWhatsAppCard
      connection={connection}
      onConnect={onConnect}
      onDisconnect={onDisconnect}
      onSetAgentPaused={onSetAgentPaused}
      onSubmitTemplates={onSubmitTemplates}
    />,
  );
  return { onConnect, onDisconnect, onSetAgentPaused, onSubmitTemplates };
};

describe("ChurchWhatsAppCard", () => {
  it("offers to connect a church without WhatsApp, with no choice of mode", async () => {
    const user = userEvent.setup();
    const { onConnect } = renderCard({ status: "NOT_CONNECTED" });

    expect(screen.getByText("Sin conectar")).toBeTruthy();
    // The church keeps its phone and the app: there is nothing to choose.
    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByText(/código QR/)).toBeTruthy();

    // Who pays Meta is said before connecting: the church, with its own card.
    expect(
      screen.getByText(
        /Meta cobra los mensajes de WhatsApp directamente a la iglesia/,
      ),
    ).toBeTruthy();
    expect(screen.getByText(/Meta Billing Hub/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Conectar WhatsApp" }));

    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it("pauses the assistant while the number stays connected", async () => {
    const user = userEvent.setup();
    const { onSetAgentPaused } = renderCard({
      status: "CONNECTED",
      displayNumber: "+51 1",
      agentPaused: false,
    });

    expect(screen.queryByText("Asistente en pausa")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Pausar asistente" }));

    expect(onSetAgentPaused).toHaveBeenCalledWith(true);
  });

  it("says the assistant is paused and offers to resume it", async () => {
    const user = userEvent.setup();
    const { onSetAgentPaused } = renderCard({
      status: "CONNECTED",
      displayNumber: "+51 1",
      agentPaused: true,
    });

    expect(screen.getByText("Asistente en pausa")).toBeTruthy();
    expect(screen.getByText(/no responde a nadie/)).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Reanudar asistente" }),
    );

    expect(onSetAgentPaused).toHaveBeenCalledWith(false);
  });

  it("does not offer to pause from a branch, whose number is the church's", () => {
    renderCard({ status: "CONNECTED", inherited: true, agentPaused: true });

    expect(
      screen.queryByRole("button", { name: "Reanudar asistente" }),
    ).toBeNull();
    expect(screen.getByText("Asistente en pausa")).toBeTruthy();
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
    // It says what happens to the number and where else to look.
    expect(screen.getByText(/se retira de Sr. Tommy y de Kapso/)).toBeTruthy();
    expect(screen.getByText(/usa «Pausar asistente»/)).toBeTruthy();

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
    // It says where the buttons are, since a branch does not have them.
    expect(screen.getByText(/entra a la iglesia/)).toBeTruthy();
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

  it("warns when the number was lost without the pastor cutting it, and offers to connect again", () => {
    renderCard({ status: "DISCONNECTED", disconnectReason: "ACCESS_REMOVED" });

    expect(screen.getByText("Desconectado")).toBeTruthy();
    expect(screen.getByText(/Se quitó el acceso de Sr. Tommy/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Conectar WhatsApp" }),
    ).toBeTruthy();
  });

  it("gives the steps to unlink the phone to the pastor who disconnected, without alarming", () => {
    renderCard({ status: "DISCONNECTED", disconnectReason: "PASTOR" });

    expect(
      screen.getByText("WhatsApp quedó desconectado de Sr. Tommy"),
    ).toBeTruthy();
    const steps = screen.getAllByRole("listitem").map((i) => i.textContent);
    expect(steps).toEqual([
      "Abre la app WhatsApp Business en el celular de la iglesia.",
      "Entra a Ajustes → Cuenta → Plataforma comercial.",
      "Toca «Kapso» y luego «Desconectar».",
    ]);
    expect(screen.getByText(/No es necesario para dejar de usar/)).toBeTruthy();
    const guide = screen.getByRole("link", {
      name: "Guía de Kapso para desconectarlo",
    });
    expect(guide.getAttribute("href")).toMatch(/^https:\/\/docs\.kapso\.ai\//);
    expect(guide.getAttribute("target")).toBe("_blank");
    expect(screen.queryByText(/El asistente no responde ni envía/)).toBeNull();
    expect(
      screen.getByRole("button", { name: "Conectar WhatsApp" }),
    ).toBeTruthy();
  });

  it("does not show the phone steps when Meta or Kapso cut the number", () => {
    renderCard({ status: "DISCONNECTED", disconnectReason: "ACCESS_REMOVED" });

    expect(screen.queryByRole("listitem")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
