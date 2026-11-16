import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { UIMessage } from "ai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AssistantPanel } from "./AssistantPanel";
import type { Assistant } from "./useAssistant";

const fakeAssistant = (overrides: Partial<Assistant> = {}) => ({
  messages: [] as UIMessage[],
  status: "ready" as Assistant["status"],
  busy: false,
  blocked: false,
  canSend: true,
  problem: undefined as Assistant["problem"],
  send: vi.fn(async () => true),
  stop: vi.fn(async () => undefined),
  retry: vi.fn(async () => undefined),
  signInAgain: vi.fn(async () => undefined),
  newConversation: vi.fn(async () => undefined),
  ...overrides,
});

const conversation: UIMessage[] = [
  {
    id: "u-1",
    role: "user",
    parts: [{ type: "text", text: "¿Cuántos somos?" }],
  },
  {
    id: "a-1",
    role: "assistant",
    parts: [{ type: "text", text: "En Sede Central hay 40 personas." }],
  },
];

const renderPanel = (
  assistant = fakeAssistant(),
  props: Partial<Parameters<typeof AssistantPanel>[0]> = {},
) => {
  const onClose = vi.fn();
  const view = render(
    <AssistantPanel
      open
      onClose={onClose}
      assistant={assistant}
      nodeName="Sede Central"
      suggestions={[
        "¿Qué eventos hay esta semana?",
        "¿Cuántas personas hay aquí?",
      ]}
      {...props}
    />,
  );
  return { ...view, onClose, assistant };
};

describe("AssistantPanel", () => {
  afterEach(cleanup);

  it("is a dialog named after the assistant that says which node it works on", () => {
    renderPanel();

    const dialog = screen.getByRole("dialog", { name: "Asistente" });
    expect(dialog).toHaveTextContent("En Sede Central");
  });

  it("puts the focus in the question field when it opens", async () => {
    const assistant = fakeAssistant();
    const panel = (open: boolean) => (
      <AssistantPanel
        open={open}
        onClose={vi.fn()}
        assistant={assistant}
        suggestions={[]}
      />
    );
    const { rerender } = render(panel(false));
    rerender(panel(true));

    const field = screen.getByRole("textbox", { name: "Escribe tu pregunta" });
    await waitFor(() => expect(field).toHaveFocus());
  });

  it("shows the suggestions when empty and sends the one picked", async () => {
    const user = userEvent.setup();
    const { assistant } = renderPanel();

    const list = screen.getByRole("list", { name: "Sugerencias" });
    await user.click(
      within(list).getByRole("button", { name: "¿Cuántas personas hay aquí?" }),
    );

    expect(assistant.send).toHaveBeenCalledWith("¿Cuántas personas hay aquí?");
  });

  it("sends with Enter and clears the field", async () => {
    const user = userEvent.setup();
    const { assistant } = renderPanel();
    const field = screen.getByRole("textbox", { name: "Escribe tu pregunta" });

    await user.type(field, "¿Qué eventos hay?{Enter}");

    expect(assistant.send).toHaveBeenCalledWith("¿Qué eventos hay?");
    expect(field).toHaveValue("");
  });

  it("starts a new line with Shift+Enter instead of sending", async () => {
    const user = userEvent.setup();
    const { assistant } = renderPanel();
    const field = screen.getByRole("textbox", { name: "Escribe tu pregunta" });

    await user.type(field, "Hola{Shift>}{Enter}{/Shift}mundo");

    expect(assistant.send).not.toHaveBeenCalled();
    expect(field).toHaveValue("Hola\nmundo");
  });

  it("sends with the button", async () => {
    const user = userEvent.setup();
    const { assistant } = renderPanel();

    await user.type(
      screen.getByRole("textbox", { name: "Escribe tu pregunta" }),
      "Hola",
    );
    await user.click(screen.getByRole("button", { name: "Enviar" }));

    expect(assistant.send).toHaveBeenCalledWith("Hola");
  });

  it("cannot send an empty question", () => {
    renderPanel();

    expect(screen.getByRole("button", { name: "Enviar" })).toBeDisabled();
  });

  it("shows the conversation instead of the suggestions", () => {
    renderPanel(fakeAssistant({ messages: conversation }));

    expect(
      screen.queryByRole("list", { name: "Sugerencias" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Conversación" }),
    ).toHaveTextContent("En Sede Central hay 40 personas.");
  });

  it("shows that it is thinking and lets the user stop it", async () => {
    const user = userEvent.setup();
    const assistant = fakeAssistant({
      messages: conversation.slice(0, 1),
      status: "submitted",
      busy: true,
      canSend: false,
    });
    renderPanel(assistant);

    expect(screen.getByText("Pensando…")).toBeInTheDocument();
    // The send button is busy (spinner) and blocked.
    expect(screen.getByRole("button", { name: /Enviar/ })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Detener" }));

    expect(assistant.stop).toHaveBeenCalledOnce();
  });

  it("starts a new conversation", async () => {
    const user = userEvent.setup();
    const assistant = fakeAssistant({ messages: conversation });
    renderPanel(assistant);

    await user.click(
      screen.getByRole("button", { name: "Conversación nueva" }),
    );

    expect(assistant.newConversation).toHaveBeenCalledOnce();
  });

  it("has nothing to clear in an empty conversation", () => {
    renderPanel();

    expect(
      screen.getByRole("button", { name: "Conversación nueva" }),
    ).toBeDisabled();
  });

  it("asks to sign in again when the session expired", async () => {
    const user = userEvent.setup();
    const assistant = fakeAssistant({
      messages: conversation.slice(0, 1),
      problem: "session",
    });
    renderPanel(assistant);

    expect(screen.getByRole("alert")).toHaveTextContent("Tu sesión venció");
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(assistant.signInAgain).toHaveBeenCalledOnce();
  });

  it("offers to retry after an error", async () => {
    const user = userEvent.setup();
    const assistant = fakeAssistant({
      messages: conversation.slice(0, 1),
      problem: "failed",
    });
    renderPanel(assistant);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "El asistente no pudo responder",
    );
    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(assistant.retry).toHaveBeenCalledOnce();
  });

  it("asks to wait while sending is blocked, then offers to retry", () => {
    const blocked = fakeAssistant({
      messages: conversation.slice(0, 1),
      problem: "rate-limit",
      blocked: true,
      canSend: false,
    });
    const { rerender } = renderPanel(blocked);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enviaste muchos mensajes seguidos",
    );
    expect(
      screen.queryByRole("button", { name: "Reintentar" }),
    ).not.toBeInTheDocument();

    rerender(
      <AssistantPanel
        open
        onClose={vi.fn()}
        assistant={{ ...blocked, blocked: false, canSend: true }}
        suggestions={[]}
      />,
    );

    expect(screen.getByRole("button", { name: "Reintentar" })).toBeEnabled();
  });

  it("says when the user has no access to the node", () => {
    renderPanel(
      fakeAssistant({
        messages: conversation.slice(0, 1),
        problem: "forbidden",
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "No tienes acceso a Sede Central desde el asistente.",
    );
  });

  it("closes with its button", async () => {
    const user = userEvent.setup();
    const { onClose } = renderPanel();

    await user.click(screen.getByRole("button", { name: "Cerrar asistente" }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps the draft while closed", async () => {
    const user = userEvent.setup();
    const assistant = fakeAssistant();
    const { rerender } = renderPanel(assistant);
    await user.type(
      screen.getByRole("textbox", { name: "Escribe tu pregunta" }),
      "A medias",
    );

    const panel = (open: boolean) => (
      <AssistantPanel
        open={open}
        onClose={vi.fn()}
        assistant={assistant}
        suggestions={[]}
      />
    );
    rerender(panel(false));
    rerender(panel(true));

    expect(
      await screen.findByRole("textbox", { name: "Escribe tu pregunta" }),
    ).toHaveValue("A medias");
  });
});
