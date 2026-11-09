"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import React from "react";
import type {
  AttendanceWelcomeResponse,
  SelfAttendanceResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { primaryButtonSx } from "@/app/(components)/buttonStyles";

type AttendanceSelfPageProps = Readonly<{
  welcome: AttendanceWelcomeResponse;
  signedIn: boolean;
  onSignIn: () => void;
  // Marks the attendance of whoever scanned; resolves with how it went or
  // with the reason when it failed.
  onMark: (name: string) => Promise<SelfAttendanceResponse | string>;
}>;

const done = (result: SelfAttendanceResponse): string => {
  if (result.alreadyMarked) return "Ya estaba marcada su asistencia.";
  switch (result.kind) {
    case "PERSON":
      return "Listo, quedó marcada su asistencia. Gracias por venir.";
    case "REGISTRATION":
      return "Listo, ingresó con su ticket. Gracias por venir.";
    case "VISITOR":
      return "Bienvenido. Quedó registrado como visitante. Gracias por venir.";
    default:
      return "Gracias por venir. Contamos su asistencia.";
  }
};

// The page behind the QR of an event: whoever scans it marks that they came.
// With an account the church already knows them; without one they may leave a
// name, or just be counted.
export const AttendanceSelfPage = ({
  welcome,
  signedIn,
  onSignIn,
  onMark,
}: AttendanceSelfPageProps) => {
  const [name, setName] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [outcome, setOutcome] = React.useState<
    SelfAttendanceResponse | string | null
  >(null);

  const mark = async (change: React.FormEvent) => {
    change.preventDefault();
    setSending(true);
    try {
      setOutcome(await onMark(name.trim()));
    } finally {
      setSending(false);
    }
  };

  const finished = typeof outcome === "object" && outcome !== null;

  return (
    <Container component="main" maxWidth="sm" sx={{ py: { xs: 2, sm: 5 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="overline"
            sx={{
              color: "text.secondary",
            }}
          >
            Asistencia · {welcome.organizationName}
          </Typography>
          <Typography variant="h4" component="h1">
            {welcome.title}
          </Typography>
        </Box>
        {welcome.start && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography>
              {format(new Date(welcome.start), "EEEE d 'de' MMMM, HH:mm", {
                locale: es,
              })}
            </Typography>
          </Paper>
        )}
        {welcome.status === "EXPIRED_CODE" && (
          <Alert severity="warning">
            Este código venció. Pida al ujier que le muestre el QR actual.
          </Alert>
        )}
        {welcome.status === "OUT_OF_WINDOW" && (
          <Alert severity="info">
            Este evento no está tomando asistencia ahora.
          </Alert>
        )}
        {typeof outcome === "string" && (
          <Alert severity="error">{outcome}</Alert>
        )}
        {finished && <Alert severity="success">{done(outcome)}</Alert>}
        {welcome.status === "OPEN" && !finished && (
          <Stack
            component="form"
            noValidate
            onSubmit={mark}
            spacing={2}
            aria-label="Marcar asistencia"
          >
            <TextField
              label="Su nombre (opcional)"
              helperText={
                signedIn
                  ? "Escríbalo solo si es su primera vez y aún no figura en la iglesia."
                  : "Si es su primera vez, escríbalo para que la iglesia lo conozca. Sin nombre, solo contamos que vino."
              }
              value={name}
              onChange={(change) => setName(change.target.value)}
              slotProps={{ htmlInput: { maxLength: 150 } }}
            />
            <LoadingButton
              type="submit"
              variant="contained"
              sx={primaryButtonSx}
              loading={sending}
            >
              Marcar mi asistencia
            </LoadingButton>
            {!signedIn && (
              <Button onClick={onSignIn} sx={{ alignSelf: "flex-start" }}>
                Ya tengo cuenta: iniciar sesión
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};
