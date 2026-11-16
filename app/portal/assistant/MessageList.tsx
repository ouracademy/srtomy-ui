"use client";

import { Box, CircularProgress, Typography } from "@mui/material";
import { getToolName, isToolUIPart, type UIMessage } from "ai";
import * as React from "react";
import { ApprovalCard } from "./ApprovalCard";
import { toolActivityLabel } from "./toolActivity";

// Read by screen readers, not shown.
export const visuallyHidden = {
  border: 0,
  clip: "rect(0 0 0 0)",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: "1px",
} as const;

type Part = UIMessage["parts"][number];

const isRunning = (part: Part) =>
  isToolUIPart(part) &&
  (part.state === "input-streaming" || part.state === "input-available");

const textOf = (message: UIMessage) =>
  message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();

// What the live region says: what the assistant is doing while it works, and
// the whole answer once it is done (not every streamed word).
export const announcementFor = (
  messages: readonly UIMessage[],
  busy: boolean,
): string => {
  const last = messages.at(-1);
  if (busy) {
    const running =
      last?.role === "assistant" && last.parts.findLast(isRunning);
    if (running && isToolUIPart(running)) {
      return toolActivityLabel(getToolName(running));
    }
    return "El asistente está respondiendo…";
  }
  return last?.role === "assistant" ? textOf(last) : "";
};

const Activity = ({ label }: Readonly<{ label: string }>) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      color: "text.secondary",
    }}
  >
    <CircularProgress size={14} aria-hidden="true" />
    <Typography variant="body2">{label}</Typography>
  </Box>
);

type Respond = (approvalId: string, approved: boolean) => void;

const AssistantPart = ({
  part,
  onApproval,
}: Readonly<{ part: Part; onApproval: Respond }>) => {
  if (part.type === "text") {
    // Plain text: line breaks kept, nothing interpreted as markup.
    return (
      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
        {part.text}
      </Typography>
    );
  }
  if (!isToolUIPart(part)) return null;
  if (
    (part.state === "approval-requested" ||
      part.state === "approval-responded") &&
    !part.approval.isAutomatic
  ) {
    return (
      <ApprovalCard
        part={{
          toolName: getToolName(part),
          input: part.input,
          approval: part.approval,
        }}
        onRespond={onApproval}
      />
    );
  }
  if (part.state === "output-denied") {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        Acción cancelada. No se cambió nada.
      </Typography>
    );
  }
  if (isRunning(part)) {
    return <Activity label={toolActivityLabel(getToolName(part))} />;
  }
  if (part.state === "output-error") {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        No se pudo completar una consulta.
      </Typography>
    );
  }
  return null;
};

type MessageListProps = Readonly<{
  messages: readonly UIMessage[];
  // Waiting for the first chunk of the answer.
  thinking: boolean;
  busy: boolean;
  onApproval: Respond;
}>;

// The conversation, newest at the bottom, and a polite live region that
// announces the new answer.
export const MessageList = ({
  messages,
  thinking,
  busy,
  onApproval,
}: MessageListProps) => {
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [messages, thinking]);

  return (
    <>
      <Box
        component="ol"
        aria-label="Conversación"
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {messages.map((message) =>
          message.role === "user" ? (
            <Box
              component="li"
              key={message.id}
              sx={{
                alignSelf: "flex-end",
                maxWidth: "85%",
                px: 1.5,
                py: 1,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              <Box component="span" sx={visuallyHidden}>
                Tú:
              </Box>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {textOf(message)}
              </Typography>
            </Box>
          ) : (
            <Box
              component="li"
              key={message.id}
              sx={{
                alignSelf: "flex-start",
                maxWidth: "95%",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Box component="span" sx={visuallyHidden}>
                Asistente:
              </Box>
              {message.parts.map((part, index) => (
                <AssistantPart
                  key={index}
                  part={part}
                  onApproval={onApproval}
                />
              ))}
            </Box>
          ),
        )}
        {thinking && (
          <Box component="li">
            <Activity label="Pensando…" />
          </Box>
        )}
      </Box>
      <div ref={endRef} />
      <Box role="status" aria-live="polite" sx={visuallyHidden}>
        {announcementFor(messages, busy)}
      </Box>
    </>
  );
};
