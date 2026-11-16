import type { ChatTransport, UIMessage, UIMessageChunk } from "ai";

// Test helpers that play srtomy-agent: the UI message stream of POST /chat
// (contracts/chat.md), so no test reaches the network.

export const textReply = (text: string, id = "text-1"): UIMessageChunk[] => [
  { type: "start" },
  { type: "start-step" },
  { type: "text-start", id },
  ...text
    .split(/(?<= )/)
    .map((delta): UIMessageChunk => ({ type: "text-delta", id, delta })),
  { type: "text-end", id },
  { type: "finish-step" },
  { type: "finish" },
];

// A read tool that runs on the server, then the answer.
export const toolThenText = (
  toolName: string,
  text: string,
  input: unknown = {},
): UIMessageChunk[] => [
  { type: "start" },
  { type: "start-step" },
  { type: "tool-input-available", toolCallId: "call-1", toolName, input },
  { type: "tool-output-available", toolCallId: "call-1", output: [] },
  { type: "finish-step" },
  { type: "start-step" },
  { type: "text-start", id: "text-1" },
  { type: "text-delta", id: "text-1", delta: text },
  { type: "text-end", id: "text-1" },
  { type: "finish-step" },
  { type: "finish" },
];

export const chunkStream = (chunks: readonly UIMessageChunk[]) =>
  new ReadableStream<UIMessageChunk>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(chunk));
      controller.close();
    },
  });

// The HTTP body the agent sends: server-sent events, one chunk per event.
export const sseBody = (chunks: readonly UIMessageChunk[]) =>
  chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("") +
  "data: [DONE]\n\n";

export const sseResponse = (chunks: readonly UIMessageChunk[]) =>
  new Response(sseBody(chunks), {
    status: 200,
    headers: {
      "content-type": "text/event-stream",
      "x-vercel-ai-ui-message-stream": "v1",
    },
  });

type SendOptions = Parameters<ChatTransport<UIMessage>["sendMessages"]>[0];

// A transport whose answers the test decides: each call takes the next reply
// (chunks, or an error to throw). Records what was sent.
export const scriptedTransport = (
  replies: Array<readonly UIMessageChunk[] | Error>,
) => {
  const calls: SendOptions[] = [];
  const transport: ChatTransport<UIMessage> = {
    sendMessages: async (options) => {
      calls.push(options);
      const reply = replies.shift();
      if (reply === undefined) throw new Error("no scripted reply left");
      if (reply instanceof Error) throw reply;
      return chunkStream(reply);
    },
    reconnectToStream: async () => null,
  };
  return { transport, calls };
};
