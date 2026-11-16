import type { ChatTransport, UIMessage, UIMessageChunk } from "ai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  sseResponse,
  textReply,
} from "@/app/portal/assistant/chatStream.test-utils";

const load = async (agentUrl = "http://agent.test/") => {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_AUTH0_DOMAIN", "tenant.example.com");
  vi.stubEnv("NEXT_PUBLIC_AUTH0_CLIENT_ID", "client");
  vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test");
  vi.stubEnv("NEXT_PUBLIC_AGENT_URL", agentUrl);
  const client = await import("./client");
  const assistant = await import("./assistant");
  return { ...client, ...assistant };
};

const question: UIMessage = {
  id: "m-1",
  role: "user",
  parts: [{ type: "text", text: "¿Qué eventos hay esta semana?" }],
};

const context = { nodeId: "node-1", timeZone: "America/Lima" };

const send = (transport: ChatTransport<UIMessage>, screen: object = context) =>
  transport.sendMessages({
    body: { context: screen },
    chatId: "chat-1",
    messages: [question],
    trigger: "submit-message",
    messageId: undefined,
    abortSignal: undefined,
  });

type FetchCall = [string, RequestInit];
const requestOf = (fetch: ReturnType<typeof vi.fn>, index = 0) =>
  fetch.mock.calls[index] as unknown as FetchCall;

const readAll = async (stream: ReadableStream<UIMessageChunk>) => {
  const chunks: UIMessageChunk[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return chunks;
    chunks.push(value);
  }
};

describe("createAssistantTransport", () => {
  beforeEach(() => vi.unstubAllEnvs());
  afterEach(() => vi.unstubAllEnvs());

  it("posts the messages and the screen context to the agent with the user's token", async () => {
    const { createAssistantTransport, setAccessTokenProvider } = await load();
    setAccessTokenProvider(async () => "token-123");
    const fetch = vi.fn(async () => sseResponse(textReply("Hola")));

    await send(createAssistantTransport({ fetch }));

    expect(fetch).toHaveBeenCalledOnce();
    const [url, init] = requestOf(fetch);
    expect(url).toBe("http://agent.test/chat");
    expect(init.method).toBe("POST");
    expect(init.credentials).toBe("omit");
    expect(new Headers(init.headers).get("authorization")).toBe(
      "Bearer token-123",
    );
    expect(JSON.parse(String(init.body))).toEqual({
      messages: [question],
      context,
    });
  });

  it("sends the context of each request, not of the first one", async () => {
    const { createAssistantTransport, setAccessTokenProvider } = await load();
    setAccessTokenProvider(async () => "token-123");
    const fetch = vi.fn(async () => sseResponse(textReply("Hola")));
    const transport = createAssistantTransport({ fetch });

    await send(transport, { nodeId: "node-1" });
    await send(transport, { nodeId: "node-2" });

    const nodeIds = [0, 1].map(
      (index) =>
        JSON.parse(String(requestOf(fetch, index)[1].body)).context.nodeId,
    );
    expect(nodeIds).toEqual(["node-1", "node-2"]);
  });

  it("streams the answer back as UI message chunks", async () => {
    const { createAssistantTransport, setAccessTokenProvider } = await load();
    setAccessTokenProvider(async () => "token-123");
    const fetch = vi.fn(async () => sseResponse(textReply("Hay dos eventos")));

    const chunks = await readAll(
      await send(createAssistantTransport({ fetch })),
    );

    const text = chunks
      .map((chunk) => (chunk.type === "text-delta" ? chunk.delta : ""))
      .join("");
    expect(text).toBe("Hay dos eventos");
  });

  it("fails with 401 and calls nobody when Auth0 cannot renew the session", async () => {
    const { createAssistantTransport, setAccessTokenProvider } = await load();
    setAccessTokenProvider(async () => {
      throw new Error("login_required");
    });
    const fetch = vi.fn();

    await expect(
      send(createAssistantTransport({ fetch })),
    ).rejects.toMatchObject({ name: "AssistantRequestError", status: 401 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("fails with 401 when there is no token at all", async () => {
    const { createAssistantTransport } = await load();
    const fetch = vi.fn();

    await expect(
      send(createAssistantTransport({ fetch })),
    ).rejects.toMatchObject({ status: 401 });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("turns an error answer into an AssistantRequestError with its Retry-After", async () => {
    const { createAssistantTransport, setAccessTokenProvider } = await load();
    setAccessTokenProvider(async () => "token-123");
    const fetch = vi.fn(
      async () =>
        new Response("Too many", {
          status: 429,
          headers: { "retry-after": "30" },
        }),
    );

    await expect(
      send(createAssistantTransport({ fetch })),
    ).rejects.toMatchObject({ status: 429, retryAfterSeconds: 30 });
  });

  it("keeps the status of other errors", async () => {
    const { createAssistantTransport, setAccessTokenProvider } = await load();
    setAccessTokenProvider(async () => "token-123");
    const fetch = vi.fn(async () => new Response("", { status: 503 }));

    await expect(
      send(createAssistantTransport({ fetch })),
    ).rejects.toMatchObject({ status: 503, retryAfterSeconds: undefined });
  });
});

describe("agentUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("drops the trailing slash", async () => {
    const { agentUrl } = await load("http://agent.test/");

    expect(agentUrl).toBe("http://agent.test");
  });

  it("is undefined when the assistant is off", async () => {
    const { agentUrl } = await load("");

    expect(agentUrl).toBeUndefined();
  });
});
