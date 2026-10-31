"use client";

import CloseIcon from "@mui/icons-material/Close";
import LoadingButton from "@mui/lab/LoadingButton";
import {
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import type { CheckInResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { primaryButtonSx } from "@/app/(components)/buttonStyles";
import { canScanWithCamera, useQrScanner } from "./useQrScanner";

type TicketScannerProps = Readonly<{
  title: string;
  close: () => void;
  // Checks a ticket in; resolves with who came, or with the reason it failed.
  onCheckIn: (ticketCode: string) => Promise<CheckInResponse | string>;
}>;

type Reading = { key: number; ok: boolean; text: string };

const timeOf = (value?: Date) =>
  value
    ? new Date(value).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const describe = (result: CheckInResponse): string =>
  result.alreadyCheckedIn
    ? `${result.name} (${result.ticketName}) ya había ingresado a las ${timeOf(result.checkedInAt)}`
    : `${result.name} (${result.ticketName}) ingresó`;

// "Escanear tickets": the usher points the camera at the QR of a ticket, or
// types its code, and sees who came in.
export const TicketScanner = ({
  title,
  close,
  onCheckIn,
}: TicketScannerProps) => {
  const [code, setCode] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [readings, setReadings] = React.useState<Reading[]>([]);
  const counter = React.useRef(0);

  const check = React.useCallback(
    async (ticketCode: string) => {
      const clean = ticketCode.trim();
      if (!clean) return;
      const result = await onCheckIn(clean);
      counter.current += 1;
      const reading: Reading =
        typeof result === "string"
          ? { key: counter.current, ok: false, text: result }
          : { key: counter.current, ok: true, text: describe(result) };
      setReadings((current) => [reading, ...current].slice(0, 8));
    },
    [onCheckIn],
  );

  const { videoRef, problem } = useQrScanner(canScanWithCamera(), (scanned) => {
    void check(scanned);
  });

  const submit = async (change: React.FormEvent) => {
    change.preventDefault();
    setSending(true);
    try {
      await check(code);
      setCode("");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open onClose={close} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pr: 7 }}>
        Escanear tickets de «{title}»
        <IconButton
          aria-label="Cerrar"
          onClick={close}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {canScanWithCamera() ? (
            <>
              <video
                ref={videoRef}
                muted
                playsInline
                aria-label="Cámara para escanear el QR del ticket"
                style={{ width: "100%", borderRadius: 8, background: "#000" }}
              />
              {problem && <Alert severity="warning">{problem}</Alert>}
            </>
          ) : (
            <Alert severity="info">
              Este navegador no puede leer QR con la cámara. Escriba el código
              del ticket, o use Chrome en el teléfono.
            </Alert>
          )}
          <Stack
            component="form"
            noValidate
            onSubmit={submit}
            direction="row"
            spacing={1}
            aria-label="Escribir el código del ticket"
          >
            <TextField
              label="Código del ticket"
              size="small"
              value={code}
              onChange={(change) => setCode(change.target.value)}
              sx={{ flex: 1 }}
            />
            <LoadingButton
              type="submit"
              variant="contained"
              sx={primaryButtonSx}
              loading={sending}
              disabled={!code.trim()}
            >
              Validar
            </LoadingButton>
          </Stack>
          <div aria-live="polite">
            {readings.length === 0 ? (
              <Typography
                sx={{
                  color: "text.secondary",
                }}
              >
                Aquí aparece quién va ingresando.
              </Typography>
            ) : (
              <List dense aria-label="Últimas lecturas">
                {readings.map((reading) => (
                  <ListItem key={reading.key} disableGutters>
                    <ListItemText
                      primary={reading.text}
                      slotProps={{
                        primary: {
                          color: reading.ok ? "success.main" : "error.main",
                        },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </div>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
