"use client";

import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import StopIcon from "@mui/icons-material/Stop";
import {
  Alert,
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import * as React from "react";
import { MessageList } from "./MessageList";
import type { Assistant } from "./useAssistant";

type PanelAssistant = Pick<
  Assistant,
  | "messages"
  | "status"
  | "busy"
  | "blocked"
  | "canSend"
  | "problem"
  | "send"
  | "stop"
  | "retry"
  | "signInAgain"
  | "newConversation"
  | "respondToApproval"
>;

type AssistantPanelProps = Readonly<{
  open: boolean;
  onClose: () => void;
  assistant: PanelAssistant;
  // Name of the open node, so the user sees what the assistant works on.
  nodeName?: string;
  suggestions: readonly string[];
}>;

const EmptyState = ({
  nodeName,
  suggestions,
  disabled,
  onPick,
}: Readonly<{
  nodeName?: string;
  suggestions: readonly string[];
  disabled: boolean;
  onPick: (text: string) => void;
}>) => (
  <Stack spacing={2}>
    <Typography variant="body2">
      Pregúntame por {nodeName ?? "tu iglesia"}: eventos, asistencia, personas y
      grupos. Si me pides un cambio, antes te muestro qué voy a hacer y espero
      tu confirmación.
    </Typography>
    {suggestions.length > 0 && (
      <Stack
        component="ul"
        aria-label="Sugerencias"
        spacing={1}
        sx={{ listStyle: "none", m: 0, p: 0 }}
      >
        {suggestions.map((text) => (
          <li key={text}>
            <Button
              variant="outlined"
              size="small"
              disabled={disabled}
              onClick={() => onPick(text)}
              sx={{ textTransform: "none", textAlign: "left" }}
            >
              {text}
            </Button>
          </li>
        ))}
      </Stack>
    )}
  </Stack>
);

const Problem = ({
  assistant,
  nodeName,
}: Readonly<{ assistant: PanelAssistant; nodeName?: string }>) => {
  const retry = (
    <Button color="inherit" size="small" onClick={() => assistant.retry()}>
      Reintentar
    </Button>
  );
  switch (assistant.problem) {
    case "session":
      return (
        <Alert
          severity="warning"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => assistant.signInAgain()}
            >
              Iniciar sesión
            </Button>
          }
        >
          Tu sesión venció. Inicia sesión de nuevo para seguir; tu mensaje no se
          perdió.
        </Alert>
      );
    case "forbidden":
      return (
        <Alert severity="error">
          No tienes acceso a {nodeName ?? "este lugar"} desde el asistente.
        </Alert>
      );
    case "rate-limit":
      return (
        <Alert severity="info" action={assistant.blocked ? undefined : retry}>
          {assistant.blocked
            ? "Enviaste muchos mensajes seguidos. Espera un momento para volver a enviar."
            : "Ya puedes volver a enviar tu mensaje."}
        </Alert>
      );
    case "failed":
      return (
        <Alert severity="error" action={retry}>
          El asistente no pudo responder. Inténtalo de nuevo.
        </Alert>
      );
    default:
      return null;
  }
};

// The assistant's side panel: full screen on a phone. Focus goes to the
// question field on open and back to the button that opened it on close (the
// drawer restores it).
export const AssistantPanel = ({
  open,
  onClose,
  assistant,
  nodeName,
  suggestions,
}: AssistantPanelProps) => {
  const titleId = React.useId();
  // Lives here, not inside the drawer, so a closed panel keeps the draft.
  const [draft, setDraft] = React.useState("");
  const fieldRef = React.useRef<HTMLTextAreaElement>(null);

  const { messages, status, busy, canSend } = assistant;
  const empty = messages.length === 0;
  const thinking = status === "submitted";

  const submit = () => {
    const text = draft.trim();
    if (!text || !canSend) return;
    setDraft("");
    void assistant.send(text);
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{
        // Once the panel is in place; earlier, the drawer's focus trap takes
        // the focus back to the panel itself.
        transition: { onEntered: () => fieldRef.current?.focus() },
        paper: {
          role: "dialog",
          "aria-modal": true,
          "aria-labelledby": titleId,
          sx: {
            width: { xs: "100%", sm: 420 },
            display: "flex",
            flexDirection: "column",
          },
        },
      }}
    >
      <Box
        component="header"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id={titleId} variant="h6" component="h2">
            Asistente
          </Typography>
          {nodeName && (
            <Typography variant="body2" noWrap sx={{ color: "text.secondary" }}>
              En {nodeName}
            </Typography>
          )}
        </Box>
        <Tooltip title="Conversación nueva">
          <span>
            <IconButton
              aria-label="Conversación nueva"
              disabled={empty}
              onClick={() => void assistant.newConversation()}
            >
              <AddCommentOutlinedIcon />
            </IconButton>
          </span>
        </Tooltip>
        <IconButton aria-label="Cerrar asistente" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        <Stack spacing={2}>
          {empty ? (
            <EmptyState
              nodeName={nodeName}
              suggestions={suggestions}
              disabled={!canSend}
              onPick={(text) => void assistant.send(text)}
            />
          ) : (
            <MessageList
              messages={messages}
              thinking={thinking}
              busy={busy}
              onApproval={assistant.respondToApproval}
            />
          )}
          <Problem assistant={assistant} nodeName={nodeName} />
        </Stack>
      </Box>

      <Box
        component="form"
        onSubmit={(event: React.FormEvent) => {
          event.preventDefault();
          submit();
        }}
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: 1,
          p: 2,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        <TextField
          label="Escribe tu pregunta"
          multiline
          maxRows={4}
          fullWidth
          size="small"
          inputRef={fieldRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            // Enter sends; Shift+Enter starts a new line.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
        />
        {busy && (
          <Button
            variant="outlined"
            startIcon={<StopIcon />}
            onClick={() => void assistant.stop()}
          >
            Detener
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          loading={busy}
          disabled={!canSend || !draft.trim()}
          endIcon={<SendIcon />}
        >
          Enviar
        </Button>
      </Box>
    </Drawer>
  );
};
