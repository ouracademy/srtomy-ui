"use client";

import { useChat } from "@ai-sdk/react";
import { useAuth0 } from "@auth0/auth0-react";
import * as React from "react";
import {
  createAssistantTransport,
  type ScreenContext,
} from "@/app/(api)/assistant";
import { AssistantRequestError } from "@/app/(api)/assistantError";

// Why the last request failed, as the panel explains it (contracts/chat.md).
export type AssistantProblem =
  | "session" // 401: sign in again; what was written stays
  | "forbidden" // 403: no access to the open node
  | "rate-limit" // 429: wait until Retry-After
  | "failed"; // anything else: retry

export const problemOf = (
  error: Error | undefined,
): AssistantProblem | undefined => {
  if (!error) return undefined;
  if (!(error instanceof AssistantRequestError)) return "failed";
  if (error.status === 401) return "session";
  if (error.status === 403) return "forbidden";
  if (error.status === 429) return "rate-limit";
  return "failed";
};

// Without Retry-After, wait this long before allowing a new message.
const DEFAULT_WAIT_SECONDS = 30;

// The portal's conversation with the assistant. It lives in this tab only and
// belongs to the signed-in user: another user (or signing out) starts empty.
export const useAssistant = (context: ScreenContext | undefined) => {
  const { user, loginWithPopup } = useAuth0();

  const transport = React.useMemo(() => createAssistantTransport(), []);
  // Every request says which screen it was sent from (contracts/chat.md).
  const request = { body: { context } };

  const [blockedUntil, setBlockedUntil] = React.useState<number>();

  const chat = useChat({
    id: `assistant-${user?.sub ?? "anonymous"}`,
    transport,
    onError: (error) => {
      if (error instanceof AssistantRequestError && error.status === 429) {
        const seconds = error.retryAfterSeconds ?? DEFAULT_WAIT_SECONDS;
        setBlockedUntil(Date.now() + seconds * 1000);
      }
    },
  });

  React.useEffect(() => {
    if (blockedUntil === undefined) return;
    const timer = setTimeout(
      () => setBlockedUntil(undefined),
      Math.max(0, blockedUntil - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [blockedUntil]);

  const { status, error, sendMessage, regenerate, stop, setMessages } = chat;
  const busy = status === "submitted" || status === "streaming";
  const blocked = blockedUntil !== undefined;
  const canSend = Boolean(context) && !busy && !blocked;

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !canSend) return false;
    await sendMessage({ text: trimmed }, request);
    return true;
  };

  // Sends the last question again (it is still in the conversation).
  const retry = async () => {
    if (!canSend) return;
    await regenerate(request);
  };

  // A popup keeps this page, and so the conversation, while Auth0 signs in.
  const signInAgain = async () => {
    try {
      await loginWithPopup();
    } catch {
      return;
    }
    await retry();
  };

  const newConversation = async () => {
    await stop();
    setMessages([]);
    chat.clearError();
  };

  return {
    messages: chat.messages,
    status,
    busy,
    blocked,
    canSend,
    problem: problemOf(error),
    send,
    stop,
    retry,
    signInAgain,
    newConversation,
  };
};

export type Assistant = ReturnType<typeof useAssistant>;
