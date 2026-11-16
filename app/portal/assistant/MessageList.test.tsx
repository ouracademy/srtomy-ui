import { cleanup, render, screen, within } from "@testing-library/react";
import type { UIMessage } from "ai";
import { afterEach, describe, expect, it, vi } from "vitest";
import { announcementFor, MessageList } from "./MessageList";

const user = (text: string, id = "u-1"): UIMessage => ({
  id,
  role: "user",
  parts: [{ type: "text", text }],
});

const answer = (parts: UIMessage["parts"], id = "a-1"): UIMessage => ({
  id,
  role: "assistant",
  parts,
});

const runningTool = (toolName: string): UIMessage["parts"][number] => ({
  type: "dynamic-tool",
  toolName,
  toolCallId: "call-1",
  state: "input-available",
  input: {},
});

describe("MessageList", () => {
  afterEach(cleanup);

  it("shows the question and the answer in plain text with its line breaks", () => {
    render(
      <MessageList
        messages={[
          user("¿Qué eventos hay?"),
          answer([
            { type: "text", text: "Hay dos:\n- Culto\n- <b>Ensayo</b>" },
          ]),
        ]}
        thinking={false}
        busy={false}
        onApproval={vi.fn()}
      />,
    );

    const items = within(
      screen.getByRole("list", { name: "Conversación" }),
    ).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Tú:¿Qué eventos hay?");
    const text = within(items[1] as HTMLElement).getByText(/Hay dos/);
    expect(text.textContent).toBe("Hay dos:\n- Culto\n- <b>Ensayo</b>");
    expect(text).toHaveStyle({ whiteSpace: "pre-wrap" });
    expect(document.querySelector("b")).toBeNull();
  });

  it("says what it is querying while a tool runs", () => {
    render(
      <MessageList
        messages={[
          user("¿Qué eventos hay?"),
          answer([runningTool("get_events")]),
        ]}
        thinking={false}
        busy
        onApproval={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("list", { name: "Conversación" }),
    ).toHaveTextContent("Consultando los eventos…");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Consultando los eventos…",
    );
  });

  it("hides a tool once it is done", () => {
    render(
      <MessageList
        messages={[
          answer([
            {
              type: "dynamic-tool",
              toolName: "get_events",
              toolCallId: "call-1",
              state: "output-available",
              input: {},
              output: [],
            },
            { type: "text", text: "No hay eventos." },
          ]),
        ]}
        thinking={false}
        busy={false}
        onApproval={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Consultando/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("list", { name: "Conversación" }),
    ).toHaveTextContent("No hay eventos.");
  });

  it("says when a query failed", () => {
    render(
      <MessageList
        messages={[
          answer([
            {
              type: "dynamic-tool",
              toolName: "get_people",
              toolCallId: "call-1",
              state: "output-error",
              input: {},
              errorText: "403",
            },
          ]),
        ]}
        thinking={false}
        busy={false}
        onApproval={vi.fn()}
      />,
    );

    expect(
      screen.getByText("No se pudo completar una consulta."),
    ).toBeInTheDocument();
  });

  it("shows that it is thinking before the answer starts", () => {
    render(
      <MessageList
        messages={[user("Hola")]}
        thinking
        busy
        onApproval={vi.fn()}
      />,
    );

    expect(screen.getByText("Pensando…")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "El asistente está respondiendo…",
    );
  });

  it("announces the whole answer once it is done", () => {
    render(
      <MessageList
        messages={[user("Hola"), answer([{ type: "text", text: "¡Hola!" }])]}
        thinking={false}
        busy={false}
        onApproval={vi.fn()}
      />,
    );

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("¡Hola!");
  });
});

describe("MessageList approvals", () => {
  afterEach(cleanup);

  const requested = (state: "approval-requested" | "output-denied") =>
    answer([
      {
        type: "dynamic-tool",
        toolName: "delete_people_id",
        toolCallId: "call-1",
        state,
        input: { id: "p-1" },
        approval:
          state === "approval-requested"
            ? { id: "ap-1", requestReason: "Eliminar a Ana Díaz" }
            : { id: "ap-1", approved: false },
      } as UIMessage["parts"][number],
    ]);

  it("shows a card for a pending action", () => {
    render(
      <MessageList
        messages={[requested("approval-requested")]}
        thinking={false}
        busy={false}
        onApproval={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("group", { name: "Confirmar eliminación" }),
    ).toHaveTextContent("Eliminar a Ana Díaz");
  });

  it("says a denied action was not done", () => {
    render(
      <MessageList
        messages={[requested("output-denied")]}
        thinking={false}
        busy={false}
        onApproval={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Acción cancelada. No se cambió nada."),
    ).toBeInTheDocument();
  });
});

describe("announcementFor", () => {
  it("is silent with no answer yet", () => {
    expect(announcementFor([], false)).toBe("");
    expect(announcementFor([user("Hola")], false)).toBe("");
  });

  it("says it is answering while text streams", () => {
    expect(
      announcementFor([answer([{ type: "text", text: "Ha" }])], true),
    ).toBe("El asistente está respondiendo…");
  });
});
