"use client";

import { Button, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { QrImage } from "@/app/(components)/QrImage";
import {
  attendancePath,
  AttendanceQrDialog,
  useAttendanceQr,
} from "./AttendanceQrDialog";

type QrCardProps = Readonly<{ eventId: string; title: string }>;

// The QR people scan with their phone to mark themselves present, shown right
// on the screen; "Pantalla completa" makes it big for the entrance.
export const QrCard = ({ eventId, title }: QrCardProps) => {
  const { token, onRetry } = useAttendanceQr(eventId);
  const [full, setFull] = useState(false);

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-label="Código QR del evento"
      sx={{ p: 2.5, borderRadius: 5 }}
    >
      <Stack spacing={1.75} alignItems="center">
        <Typography
          variant="h6"
          component="h2"
          fontWeight={700}
          sx={{ alignSelf: "flex-start", fontSize: 16 }}
        >
          QR para marcar solos
        </Typography>
        {token ? (
          <QrImage
            value={`${globalThis.location?.origin ?? ""}${attendancePath(token)}`}
            label="QR para marcar la asistencia"
            size={168}
          />
        ) : onRetry ? (
          <Stack spacing={1} alignItems="center" role="alert">
            <Typography variant="body2">
              No se pudo crear el código de asistencia.
            </Typography>
            <Button variant="outlined" size="small" onClick={onRetry}>
              Reintentar
            </Button>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Preparando el código…
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" align="center">
          Cambia solo cada pocos minutos. Muéstralo en la entrada.
        </Typography>
        <Button
          variant="outlined"
          fullWidth
          disabled={!token}
          onClick={() => setFull(true)}
        >
          Pantalla completa
        </Button>
      </Stack>
      {full && (
        <AttendanceQrDialog
          eventId={eventId}
          title={title}
          close={() => setFull(false)}
        />
      )}
    </Paper>
  );
};
