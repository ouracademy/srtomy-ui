"use client";

import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import {
  Alert,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";
import type {
  LinkCodeResponse,
  WhatsAppLinkResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { SaveButton } from "@/app/(components)/SaveButton";
import { linkMessage, minutesLeft, waMeUrl } from "./whatsappLink";

type MyWhatsAppCardProps = Readonly<{
  link: WhatsAppLinkResponse;
  // Asks for a new code (the previous one stops working). Undefined when it
  // could not be made: the screen has already said why.
  onRequestCode: () => Promise<LinkCodeResponse | undefined>;
  onUnlink: () => Promise<void>;
  // Only so a test can fix the clock; the screen uses the real one.
  now?: () => Date;
}>;

// Links the person's own WhatsApp to their account. The person asks for a code
// here and sends it from their WhatsApp to the number of the church: that
// proves the account and the number are theirs, so the assistant can act with
// everything their account can do.
export const MyWhatsAppCard = ({
  link,
  onRequestCode,
  onUnlink,
  now = () => new Date(),
}: MyWhatsAppCardProps) => {
  const [code, setCode] = React.useState<LinkCodeResponse | null>(null);
  const [asking, setAsking] = React.useState(false);
  const [confirmingCut, setConfirmingCut] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const ask = async () => {
    setAsking(true);
    try {
      const asked = await onRequestCode();
      if (asked) {
        setCode(asked);
        setCopied(false);
      }
    } finally {
      setAsking(false);
    }
  };

  const copy = async () => {
    if (!code?.code) return;
    await navigator.clipboard.writeText(linkMessage(code.code));
    setCopied(true);
  };

  const open = code?.code ? waMeUrl(code.displayNumber, code.code) : undefined;

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography component="h2" variant="h6">
            Mi WhatsApp
          </Typography>
          <Chip
            size="small"
            color={link.linked ? "success" : "default"}
            label={link.linked ? "Vinculado" : "Sin vincular"}
          />
        </Stack>

        {link.linked ? (
          <Typography>
            Tu número <strong>{link.maskedPhone}</strong> está vinculado a tu
            cuenta. El asistente puede ayudarte con lo que tu cuenta permite y
            te pedirá confirmar antes de cambiar algo.
          </Typography>
        ) : (
          <Typography color="text.secondary">
            Sin vincular, el asistente te atiende como a cualquier miembro. Si
            vinculas tu WhatsApp podrá ayudarte con todo lo que tu cuenta
            permite. Se hace una sola vez.
          </Typography>
        )}

        {code?.code && (
          <Alert severity="info" icon={<WhatsAppIcon />}>
            <Stack spacing={1}>
              <Typography>
                Envía este mensaje desde tu WhatsApp
                {code.displayNumber ? ` al ${code.displayNumber}` : ""}:
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography
                  component="code"
                  sx={{ fontSize: "1.25rem", fontWeight: 700 }}
                >
                  {linkMessage(code.code)}
                </Typography>
                <Tooltip title={copied ? "Copiado" : "Copiar mensaje"}>
                  <IconButton aria-label="Copiar mensaje" onClick={copy}>
                    <ContentCopyOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Typography variant="caption">
                Vale {minutesLeft(code.expiresAt, now())} minutos y solo se usa
                una vez.
              </Typography>
              {open && (
                <div>
                  <Button
                    component="a"
                    href={open}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<WhatsAppIcon />}
                  >
                    Abrir WhatsApp
                  </Button>
                </div>
              )}
            </Stack>
          </Alert>
        )}

        <Stack direction="row" spacing={1}>
          <SaveButton
            name={link.linked ? "Vincular otro número" : "Obtener código"}
            loading={asking}
            onClick={ask}
          />
          {link.linked && (
            <Button
              color="error"
              variant="outlined"
              onClick={() => setConfirmingCut(true)}
            >
              Desvincular
            </Button>
          )}
        </Stack>
      </Stack>

      <DialogDeleteConfirmation
        open={confirmingCut}
        title="¿Desvincular tu WhatsApp?"
        message="El asistente volverá a atenderte como a cualquier miembro. Puedes vincularlo otra vez cuando quieras."
        confirmLabel="Desvincular"
        close={() => setConfirmingCut(false)}
        onDelete={async () => {
          await onUnlink();
          setConfirmingCut(false);
        }}
      />
    </Paper>
  );
};
