"use client";

import CloseIcon from "@mui/icons-material/Close";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import React from "react";
import { useGetEventsByIdAttendanceQr } from "@/app/(api)/generated";
import { QrImage } from "@/app/(components)/QrImage";

// The page that scanning the QR opens (/a/{token}).
export const attendancePath = (token: string) => `/a/${token}`;

type AttendanceQrViewProps = Readonly<{
  title: string;
  // Null while the code is being made.
  token: string | null;
  close: () => void;
}>;

// What the usher shows: a big QR that people scan with the camera of their
// phone to mark that they came.
export const AttendanceQrView = ({
  title,
  token,
  close,
}: AttendanceQrViewProps) => (
  <Dialog open onClose={close} fullWidth maxWidth="sm">
    <DialogTitle sx={{ pr: 7 }}>
      QR de asistencia de «{title}»
      <IconButton
        aria-label="Cerrar"
        onClick={close}
        sx={{ position: "absolute", right: 8, top: 8 }}
      >
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent>
      <Stack spacing={2} alignItems="center" sx={{ py: 2 }}>
        {token ? (
          <QrImage
            value={`${globalThis.location?.origin ?? ""}${attendancePath(token)}`}
            label="QR para marcar la asistencia"
            size={320}
          />
        ) : (
          <Typography color="text.secondary">Preparando el código…</Typography>
        )}
        <Typography align="center">
          Pida a la gente que lo escanee con la cámara del teléfono para marcar
          que vino. No hace falta tener cuenta.
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          El código se renueva solo cada pocos minutos: deje esta pantalla
          abierta.
        </Typography>
      </Stack>
    </DialogContent>
  </Dialog>
);

// Asks the API for the code and asks again when it is time to renew it.
export const AttendanceQrDialog = ({
  eventId,
  title,
  close,
}: Readonly<{ eventId: string; title: string; close: () => void }>) => {
  const { data, mutate } = useGetEventsByIdAttendanceQr(eventId);
  const refreshAt = data?.refreshAt;

  React.useEffect(() => {
    if (!refreshAt) return;
    // A few seconds before it stops being the current one, never in a loop.
    const wait = Math.max(
      new Date(refreshAt).getTime() - Date.now() - 5000,
      5000,
    );
    const timer = setTimeout(() => void mutate(), wait);
    return () => clearTimeout(timer);
  }, [refreshAt, mutate]);

  return (
    <AttendanceQrView title={title} token={data?.token ?? null} close={close} />
  );
};
