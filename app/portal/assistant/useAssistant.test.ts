import { act, renderHook, waitFor } from "@testing-library/react";
import type { UIMessage } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssistantRequestError } from "@/app/(api)/assistantError";
import { scriptedTransport, textReply } from "./chatStream.test-utils";
import * as dataChanged from "@/app/(hooks)/dataChanged";
import { planLimitMessage, problemOf, useAssistant } from "./useAssistant";

const swr = vi.hoisted(() => ({ mutate: vi.fn() }));
vi.mock("swr", () => ({ useSWRConfig: () => swr }));

const auth = vi.hoisted(() => ({
  user: { sub: "auth0|ana" } as { sub: string } | undefined,
  loginWithPopup: vi.fn(),
}));
vi.mock("@auth0/auth0-react", () => ({ useAuth0: () => auth }));

const agent = vi.hoisted(() => ({ transport: undefined as unknown }));
vi.mock("@/app/(api)/assistant", () => ({
  createAssistantTransport: () => {
    // Delegates, so each test can script its own replies.
    return {
      sendMessages: (options: unknown) =>
        (
          agent.transport as {
            sendMessages: (options: unknown) => Promise<unknown>;
          }
        ).sendMessages(options),
      reconnectToStream: async () => null,
    };
  },
}));

const script = (...replies: Parameters<typeof scriptedTransport>[0]) => {
  const scripted = scriptedTransport(replies);
  agent.transport = scripted.transport;
  return scripted.calls;
};

const textOf = (message: UIMessage | undefined) =>
  message?.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");

const node = { nodeId: "node-1", timeZone: "America/Lima" };

describe("useAssistant", () => {
  beforeEach(() => {
    auth.user = { sub: "auth0|ana" };
    auth.loginWithPopup.mockReset();
    swr.mutate.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("sends the question and streams the answer", async () => {
    const calls = script(textReply("Hay dos eventos esta semana."));
    const { result } = renderHook(() => useAssistant(node));

    await act(() => result.current.send("  ¿Qué eventos hay?  "));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(calls).toHaveLength(1);
    expect(result.current.messages.map((m) => m.role)).toEqual([
      "user",
      "assistant",
    ]);
    expect(textOf(result.current.messages[0])).toBe("¿Qué eventos hay?");
    expect(textOf(result.current.messages[1])).toBe(
      "Hay dos eventos esta semana.",
    );
  });

  it("ignores an empty question", async () => {
    const calls = script();
    const { result } = renderHook(() => useAssistant(node));

    let sent = true;
    await act(async () => {
      sent = await result.current.send("   ");
    });

    expect(sent).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("cannot send outside a node", () => {
    script();
    const { result } = renderHook(() => useAssistant(undefined));

    expect(result.current.canSend).toBe(false);
  });

  it("sends the screen of each request, also after moving", async () => {
    const calls = script(textReply("Uno."), textReply("Dos."));
    const { result, rerender } = renderHook(
      ({ context }) => useAssistant(context),
      { initialProps: { context: node } },
    );
    await act(() => result.current.send("¿Cuántos somos?"));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    rerender({ context: { nodeId: "node-2", timeZone: "America/Lima" } });
    await act(() => result.current.send("¿Y aquí?"));
    await waitFor(() => expect(result.current.messages).toHaveLength(4));

    expect(calls.map((call) => call.body)).toEqual([
      { context: node },
      { context: { nodeId: "node-2", timeZone: "America/Lima" } },
    ]);
  });

  it("keeps the question and retries it after an error", async () => {
    const calls = script(new Error("network"), textReply("Listo."));
    const { result } = renderHook(() => useAssistant(node));

    await act(() => result.current.send("¿Cuántos somos?"));
    await waitFor(() => expect(result.current.problem).toBe("failed"));
    expect(textOf(result.current.messages[0])).toBe("¿Cuántos somos?");

    await act(() => result.current.retry());

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.problem).toBeUndefined();
    expect(calls).toHaveLength(2);
    expect(calls[1]?.messages.map(textOf)).toEqual(["¿Cuántos somos?"]);
    expect(calls[1]?.body).toEqual({ context: node });
    expect(textOf(result.current.messages[1])).toBe("Listo.");
  });

  it("asks to sign in again on 401 and retries after the popup", async () => {
    script(new AssistantRequestError(401), textReply("Somos 40."));
    auth.loginWithPopup.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAssistant(node));

    await act(() => result.current.send("¿Cuántos somos?"));
    await waitFor(() => expect(result.current.problem).toBe("session"));

    await act(() => result.current.signInAgain());

    expect(auth.loginWithPopup).toHaveBeenCalledOnce();
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(textOf(result.current.messages[1])).toBe("Somos 40.");
  });

  it("keeps the session problem when the sign-in popup is closed", async () => {
    const calls = script(new AssistantRequestError(401));
    auth.loginWithPopup.mockRejectedValue(new Error("popup closed"));
    const { result } = renderHook(() => useAssistant(node));

    await act(() => result.current.send("¿Cuántos somos?"));
    await waitFor(() => expect(result.current.problem).toBe("session"));
    await act(() => result.current.signInAgain());

    expect(result.current.problem).toBe("session");
    expect(calls).toHaveLength(1);
  });

  it("blocks sending until Retry-After passes on 429", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    script(new AssistantRequestError(429, 20));
    const { result } = renderHook(() => useAssistant(node));

    await act(() => result.current.send("Hola"));
    await waitFor(() => expect(result.current.problem).toBe("rate-limit"));
    expect(result.current.blocked).toBe(true);
    expect(result.current.canSend).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(20_000);
    });

    expect(result.current.blocked).toBe(false);
    expect(result.current.canSend).toBe(true);
  });

  it("waits 30 seconds when the agent gives no Retry-After", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    script(new AssistantRequestError(429));
    const { result } = renderHook(() => useAssistant(node));

    await act(() => result.current.send("Hola"));
    await waitFor(() => expect(result.current.blocked).toBe(true));
    await act(async () => {
      vi.advanceTimersByTime(29_000);
    });
    expect(result.current.blocked).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(1_000);
    });
    expect(result.current.blocked).toBe(false);
  });

  it("starts a new conversation", async () => {
    script(new AssistantRequestError(503));
    const { result } = renderHook(() => useAssistant(node));
    await act(() => result.current.send("Hola"));
    await waitFor(() => expect(result.current.problem).toBe("failed"));

    await act(() => result.current.newConversation());

    expect(result.current.messages).toEqual([]);
    expect(result.current.problem).toBeUndefined();
  });

  it("forgets the conversation when the user changes (sign out)", async () => {
    script(textReply("Hola, Ana."));
    const { result, rerender } = renderHook(() => useAssistant(node));
    await act(() => result.current.send("Hola"));
    await waitFor(() => expect(result.current.messages).toHaveLength(2));

    auth.user = { sub: "auth0|luis" };
    rerender();

    expect(result.current.messages).toEqual([]);
  });
});

const askToCreate = (toolName = "post_events") => [
  { type: "start" } as const,
  { type: "start-step" } as const,
  {
    type: "tool-input-available",
    toolCallId: "call-1",
    toolName,
    input: { body: { name: "Ensayo" } },
    dynamic: true,
  } as const,
  {
    type: "tool-approval-request",
    toolCallId: "call-1",
    approvalId: "ap-1",
    reason: "Crear evento: Ensayo",
  } as const,
  { type: "finish-step" } as const,
  { type: "finish" } as const,
];

const afterApproval = [
  { type: "start" } as const,
  { type: "start-step" } as const,
  {
    type: "tool-output-available",
    toolCallId: "call-1",
    output: { id: "e-1" },
    dynamic: true,
  } as const,
  { type: "finish-step" } as const,
  { type: "start-step" } as const,
  { type: "text-start", id: "t" } as const,
  { type: "text-delta", id: "t", delta: "Listo, creé el evento." } as const,
  { type: "text-end", id: "t" } as const,
  { type: "finish-step" } as const,
  { type: "finish" } as const,
];

const approvalPartOf = (message: UIMessage | undefined) =>
  message?.parts.find((part) => part.type === "dynamic-tool");

const notified = vi.spyOn(dataChanged, "notifyDataChanged");

describe("useAssistant confirmations", () => {
  beforeEach(() => {
    notified.mockClear();
    auth.user = { sub: "auth0|ana" };
    swr.mutate.mockReset();
  });

  it("sends the answer on its own, runs the action and revalidates the screens", async () => {
    const calls = script(askToCreate(), afterApproval);
    const { result } = renderHook(() => useAssistant(node));
    await act(() => result.current.send("Crea el evento Ensayo"));
    await waitFor(() =>
      expect(approvalPartOf(result.current.messages[1])).toMatchObject({
        state: "approval-requested",
        approval: { id: "ap-1", requestReason: "Crear evento: Ensayo" },
      }),
    );
    expect(swr.mutate).not.toHaveBeenCalled();

    await act(() => result.current.respondToApproval("ap-1", true));

    await waitFor(() => expect(calls).toHaveLength(2));
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(textOf(result.current.messages[1])).toContain(
      "Listo, creé el evento.",
    );
    expect(swr.mutate).toHaveBeenCalledOnce();
    expect(notified).toHaveBeenCalledOnce();
  });

  it("does not revalidate after a read", async () => {
    script([
      { type: "start" },
      { type: "start-step" },
      {
        type: "tool-input-available",
        toolCallId: "c",
        toolName: "get_events",
        input: {},
        dynamic: true,
      },
      {
        type: "tool-output-available",
        toolCallId: "c",
        output: [],
        dynamic: true,
      },
      { type: "finish-step" },
      { type: "finish" },
    ]);
    const { result } = renderHook(() => useAssistant(node));
    await act(() => result.current.send("¿Qué eventos hay?"));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    expect(swr.mutate).not.toHaveBeenCalled();
  });

  it("answers «no» to a pending action when the user writes instead", async () => {
    const calls = script(askToCreate(), textReply("Entendido, no lo creo."));
    const { result } = renderHook(() => useAssistant(node));
    await act(() => result.current.send("Crea el evento Ensayo"));
    await waitFor(() =>
      expect(approvalPartOf(result.current.messages[1])).toMatchObject({
        state: "approval-requested",
      }),
    );

    await act(() => result.current.send("Mejor no"));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    // One request for the new message, carrying the denial; no extra one.
    expect(calls).toHaveLength(2);
    expect(approvalPartOf(calls[1]?.messages[1])).toMatchObject({
      state: "approval-responded",
      approval: { id: "ap-1", approved: false },
    });
    expect(textOf(calls[1]?.messages[2])).toBe("Mejor no");
    expect(swr.mutate).not.toHaveBeenCalled();
  });

  it("cancels with the card's «Cancelar» and tells the agent", async () => {
    const calls = script(askToCreate(), textReply("Cancelado."));
    const { result } = renderHook(() => useAssistant(node));
    await act(() => result.current.send("Crea el evento Ensayo"));
    await waitFor(() =>
      expect(approvalPartOf(result.current.messages[1])).toMatchObject({
        state: "approval-requested",
      }),
    );

    await act(() => result.current.respondToApproval("ap-1", false));

    await waitFor(() => expect(calls).toHaveLength(2));
    expect(approvalPartOf(calls[1]?.messages[1])).toMatchObject({
      approval: { approved: false },
    });
    expect(swr.mutate).not.toHaveBeenCalled();
  });
});

describe("problemOf", () => {
  it.each([
    [401, "session"],
    [403, "forbidden"],
    [429, "rate-limit"],
    [422, "failed"],
    [503, "failed"],
  ])("explains %i as %s", (status, problem) => {
    expect(problemOf(new AssistantRequestError(status))).toBe(problem);
  });

  it("explains a refusal of the plan, and only when it says why", () => {
    const limit = { code: "ai.quota", message: "Sin cuota." };

    expect(problemOf(new AssistantRequestError(402, undefined, limit))).toBe(
      "plan-limit",
    );
    expect(problemOf(new AssistantRequestError(402))).toBe("failed");
    expect(
      planLimitMessage(new AssistantRequestError(402, undefined, limit)),
    ).toBe("Sin cuota.");
    expect(planLimitMessage(new TypeError("x"))).toBeUndefined();
  });

  it("treats any other error as a failure to retry", () => {
    expect(problemOf(new TypeError("Failed to fetch"))).toBe("failed");
  });

  it("has no problem without an error", () => {
    expect(problemOf(undefined)).toBeUndefined();
  });
});
