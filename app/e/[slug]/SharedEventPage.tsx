"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import {
  Alert,
  Box,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import type { SharedEventResponse } from "@/app/(api)/generated/aPISrTommy.schemas";
import { primaryButtonSx } from "@/app/(components)/buttonStyles";
import { eventWhen } from "./eventWhen";

export type Registration = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

type SharedEventPageProps = Readonly<{
  event: SharedEventResponse;
  // Pre-fills the form for someone who is signed in.
  defaults?: Partial<Registration>;
  // Resolves with what to tell the user: true when they were already signed
  // up, a string with the reason when it failed.
  onRegister: (values: Registration) => Promise<boolean | string>;
}>;

const emailLooksValid = (email: string) => /^\S+@\S+\.\S+$/.test(email.trim());

// The page someone gets with the link of an event or course: what it is and
// when, and, when the link allows it, the form to sign up.
export const SharedEventPage = ({
  event,
  defaults,
  onRegister,
}: SharedEventPageProps) => {
  const [values, setValues] = React.useState<Registration>({
    firstName: defaults?.firstName ?? "",
    lastName: defaults?.lastName ?? "",
    email: defaults?.email ?? "",
    phoneNumber: defaults?.phoneNumber ?? "",
  });
  const [submitted, setSubmitted] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [outcome, setOutcome] = React.useState<boolean | string | null>(null);

  const missing = {
    firstName: !values.firstName.trim(),
    lastName: !values.lastName.trim(),
    email: !emailLooksValid(values.email),
  };
  const set =
    (field: keyof Registration) => (change: { target: { value: string } }) =>
      setValues({ ...values, [field]: change.target.value });

  const submit = async (change: React.FormEvent) => {
    change.preventDefault();
    setSubmitted(true);
    if (missing.firstName || missing.lastName || missing.email) return;
    setSending(true);
    try {
      setOutcome(await onRegister(values));
    } finally {
      setSending(false);
    }
  };

  const registered = event.registered || outcome === false;
  const done = outcome === true || outcome === false;

  return (
    <Container component="main" maxWidth="sm" sx={{ py: { xs: 2, sm: 5 } }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            {event.isACourse ? "Curso" : "Evento"} · {event.organizationName}
          </Typography>
          <Typography variant="h4" component="h1">
            {event.title}
          </Typography>
        </Box>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography>
            {eventWhen({
              start: event.start,
              end: event.end,
              recurrence: event.recurrence,
            })}
          </Typography>
          {event.address && <Typography>Lugar: {event.address}</Typography>}
        </Paper>
        {event.description && <Typography>{event.description}</Typography>}
        {registered && !done && (
          <Alert severity="success">Ya está inscrito en este curso.</Alert>
        )}
        {done && (
          <Alert severity="success">
            {outcome === true
              ? "Ya estaba inscrito con ese correo."
              : "Listo, quedó inscrito. Gracias."}
          </Alert>
        )}
        {typeof outcome === "string" && (
          <Alert severity="error">{outcome}</Alert>
        )}
        {event.canRegister && !registered && !done && (
          <Stack
            component="form"
            noValidate
            onSubmit={submit}
            spacing={2}
            aria-label="Inscripción"
          >
            <Typography variant="h6" component="h2">
              Inscribirse
            </Typography>
            <TextField
              label="Nombre"
              required
              value={values.firstName}
              onChange={set("firstName")}
              error={submitted && missing.firstName}
              helperText={
                submitted && missing.firstName ? "Ingrese su nombre" : ""
              }
            />
            <TextField
              label="Apellido"
              required
              value={values.lastName}
              onChange={set("lastName")}
              error={submitted && missing.lastName}
              helperText={
                submitted && missing.lastName ? "Ingrese su apellido" : ""
              }
            />
            <TextField
              label="Correo electrónico"
              type="email"
              required
              value={values.email}
              onChange={set("email")}
              error={submitted && missing.email}
              helperText={
                submitted && missing.email ? "Ingrese un correo válido" : ""
              }
            />
            <TextField
              label="Teléfono"
              type="tel"
              value={values.phoneNumber}
              onChange={set("phoneNumber")}
            />
            <LoadingButton
              type="submit"
              variant="contained"
              sx={primaryButtonSx}
              loading={sending}
            >
              Inscribirme
            </LoadingButton>
          </Stack>
        )}
      </Stack>
    </Container>
  );
};
