import { act, renderHook, waitFor } from "@testing-library/react";
import type { UIMessage } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AssistantRequestError } from "@/app/(api)/assistantError";
import { scriptedTransport, textReply } from "./chatStream.test-utils";
import { problemOf, useAssistant } from "./useAssistant";

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

  it("treats any other error as a failure to retry", () => {
    expect(problemOf(new TypeError("Failed to fetch"))).toBe("failed");
  });

  it("has no problem without an error", () => {
    expect(problemOf(undefined)).toBeUndefined();
  });
});
