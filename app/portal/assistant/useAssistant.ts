"use client";

import { useChat } from "@ai-sdk/react";
import {
  getToolName,
  isToolUIPart,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { useAuth0 } from "@auth0/auth0-react";
import * as React from "react";
import { useSWRConfig } from "swr";
import {
  createAssistantTransport,
  type ScreenContext,
} from "@/app/(api)/assistant";
import { AssistantRequestError } from "@/app/(api)/assistantError";
import { notifyDataChanged } from "@/app/(hooks)/dataChanged";
import { isWrite } from "./approval";

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

  const { mutate } = useSWRConfig();
  // Set while a new message is about to answer a pending confirmation with
  // «no»: that answer must not be sent on its own, the message carries it.
  const holdAutoSend = React.useRef(false);

  const chat = useChat({
    id: `assistant-${user?.sub ?? "anonymous"}`,
    transport,
    // Answering a confirmation sends it to the agent, which then runs the
    // action (or drops it).
    sendAutomaticallyWhen: (options) =>
      !holdAutoSend.current &&
      lastAssistantMessageIsCompleteWithApprovalResponses(options),
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

  const {
    status,
    error,
    messages,
    sendMessage,
    regenerate,
    stop,
    setMessages,
    addToolApprovalResponse,
  } = chat;

  // When an action that changes data finishes, every screen revalidates so it
  // shows the change without reloading.
  const revalidated = React.useRef(new Set<string>());
  React.useEffect(() => {
    let changed = false;
    for (const message of messages) {
      for (const part of message.parts) {
        if (
          isToolUIPart(part) &&
          part.state === "output-available" &&
          isWrite(getToolName(part)) &&
          !revalidated.current.has(part.toolCallId)
        ) {
          revalidated.current.add(part.toolCallId);
          changed = true;
        }
      }
    }
    if (changed) {
      void mutate(() => true);
      notifyDataChanged();
    }
  }, [messages, mutate]);

  const pendingApprovals = () =>
    messages
      .flatMap((message) => message.parts)
      .filter(isToolUIPart)
      .flatMap((part) =>
        part.state === "approval-requested" ? [part.approval.id] : [],
      );

  const respondToApproval = async (id: string, approved: boolean) => {
    await addToolApprovalResponse({ id, approved });
  };
  const busy = status === "submitted" || status === "streaming";
  const blocked = blockedUntil !== undefined;
  const canSend = Boolean(context) && !busy && !blocked;

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !canSend) return false;
    // A message instead of the buttons cancels the pending action.
    const pending = pendingApprovals();
    if (pending.length > 0) {
      holdAutoSend.current = true;
      try {
        for (const id of pending) {
          await addToolApprovalResponse({ id, approved: false });
        }
      } finally {
        holdAutoSend.current = false;
      }
    }
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
    messages,
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
    respondToApproval,
  };
};

export type Assistant = ReturnType<typeof useAssistant>;
