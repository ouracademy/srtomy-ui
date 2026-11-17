import { DefaultChatTransport, type UIMessage } from "ai";
import { env } from "../env";
import {
  AssistantRequestError,
  parseRetryAfter,
  planLimitFrom,
} from "./assistantError";
import { getAccessToken } from "./client";

// srtomy-agent is the portal's second backend: the AI assistant. Its contract
// is specs/017-ai-assistant-chat/contracts/chat.md. Like client.ts for
// srtomy-api, this is the only place that knows its URL and sends the token.

// Origin of srtomy-agent, or undefined when the assistant is off.
export const agentUrl = env.NEXT_PUBLIC_AGENT_URL?.replace(/\/+$/, "");

// Where the user is, so the assistant answers about it without being told.
// The agent never trusts it for permissions: srtomy-api decides with the
// user's token.
export type ScreenContext = {
  nodeId: string;
  eventId?: string;
  personId?: string;
  timeZone?: string;
};

const authorizationHeader = async () => {
  let token: string | undefined;
  try {
    token = await getAccessToken();
  } catch {
    throw new AssistantRequestError(401);
  }
  if (!token) throw new AssistantRequestError(401);
  return { authorization: `Bearer ${token}` };
};

type TransportOptions = Readonly<{
  fetch?: typeof globalThis.fetch;
}>;

// The transport of useChat towards POST /chat: the user's Auth0 token and no
// cookies. Each request passes the screen it was sent from as
// `body: { context }` (useAssistant does), so a message sent after moving to
// another node is about the new one.
export const createAssistantTransport = ({
  fetch = globalThis.fetch,
}: TransportOptions = {}) =>
  new DefaultChatTransport<UIMessage>({
    api: `${agentUrl ?? ""}/chat`,
    credentials: "omit",
    headers: authorizationHeader,
    prepareSendMessagesRequest: ({ messages, body }) => ({
      body: { messages, context: body?.context as ScreenContext | undefined },
    }),
    fetch: async (input, init) => {
      const response = await fetch(input, init);
      if (!response.ok) {
        // 402: the plan says no (quota of messages, spending cap, or no plan).
        const limit =
          response.status === 402 || response.status === 503
            ? planLimitFrom(
                await response
                  .clone()
                  .json()
                  .catch(() => null),
              )
            : undefined;
        throw new AssistantRequestError(
          response.status,
          parseRetryAfter(response.headers.get("retry-after")),
          limit,
        );
      }
      return response;
    },
  });
