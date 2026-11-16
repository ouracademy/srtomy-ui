import type { Route } from "@playwright/test";
import { AGENT_URL } from "./e2e-env";

// Plays srtomy-agent's POST /chat (specs/017-ai-assistant-chat/contracts/chat.md):
// the UI message stream of the AI SDK, as server-sent events.

export const CHAT_URL = `${AGENT_URL}/chat`;

type Chunk = Record<string, unknown> & { type: string };

// What the agent answered to "¿Qué eventos hay esta semana?": it reads the
// events, then writes the answer in several pieces.
export const eventsThisWeek: Chunk[] = [
  { type: "start", messageId: "msg-1" },
  { type: "start-step" },
  {
    type: "tool-input-available",
    toolCallId: "call-1",
    toolName: "get_events",
    input: { organizationId: "node", from: "2026-11-16", to: "2026-11-22" },
    dynamic: true,
  },
  {
    type: "tool-output-available",
    toolCallId: "call-1",
    output: [{ title: "Culto dominical" }, { title: "Ensayo de alabanza" }],
    dynamic: true,
  },
  { type: "finish-step" },
  { type: "start-step" },
  { type: "text-start", id: "t-1" },
  ...[
    "Esta semana hay dos eventos:\n",
    "- Culto dominical\n",
    "- Ensayo de alabanza",
  ].map((delta) => ({ type: "text-delta", id: "t-1", delta })),
  { type: "text-end", id: "t-1" },
  { type: "finish-step" },
  { type: "finish" },
];

export const textAnswer = (text: string): Chunk[] => [
  { type: "start" },
  { type: "start-step" },
  { type: "text-start", id: "t-1" },
  { type: "text-delta", id: "t-1", delta: text },
  { type: "text-end", id: "t-1" },
  { type: "finish-step" },
  { type: "finish" },
];

export const sse = (chunks: readonly Chunk[]) =>
  chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join("") +
  "data: [DONE]\n\n";

export const fulfillChat = (route: Route, chunks: readonly Chunk[]) =>
  route.fulfill({
    status: 200,
    headers: {
      "content-type": "text/event-stream",
      "x-vercel-ai-ui-message-stream": "v1",
      "access-control-allow-origin": "*",
    },
    body: sse(chunks),
  });
