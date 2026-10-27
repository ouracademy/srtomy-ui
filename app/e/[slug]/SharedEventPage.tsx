"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import {
  Alert,
  Box,
  Button,
  Container,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React from "react";
import type {
  RegistrationOutcomeResponse,
  SharedEventResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { QrImage } from "@/app/(components)/QrImage";
import { primaryButtonSx } from "@/app/(components)/buttonStyles";
import { formatPrice, remainingLabel } from "@/app/(components)/registration";
import { eventWhen } from "./eventWhen";

export type SignUp = {
  ticketTypeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

type Fields = Omit<SignUp, "ticketTypeId">;

type SharedEventPageProps = Readonly<{
  event: SharedEventResponse;
  // Whether the visitor has an account session.
  signedIn?: boolean;
  onSignIn?: () => void;
  // Pre-fills the form for someone who is signed in.
  defaults?: Partial<Fields>;
  // Resolves with how it went, or with the reason when it failed.
  onRegister: (values: SignUp) => Promise<RegistrationOutcomeResponse | string>;
  // Cancels with the code they kept; resolves true when it worked.
  onCancel: (cancelCode: string) => Promise<boolean>;
  // The address that cancels a sign-up, to keep or share.
  cancelLink: (cancelCode: string) => string;
  onCopy: (url: string) => void;
}>;

const emailLooksValid = (email: string) => /^\S+@\S+\.\S+$/.test(email.trim());

const stateLabel = {
  CONFIRMED: "confirmado",
  WAITLISTED: "en lista de espera",
} as const;

// The page someone gets with the link of an event or course: what it is and
// when and, when it takes sign-ups, the tickets and the form to sign up.
export const SharedEventPage = ({
  event,
  signedIn = false,
  onSignIn,
  defaults,
  onRegister,
  onCancel,
  cancelLink,
  onCopy,
}: SharedEventPageProps) => {
  const registration = event.registration;
  const tickets = registration?.tickets ?? [];
  const canPick = (ticket: (typeof tickets)[number]) =>
    Boolean(ticket.onSale) &&
    (ticket.remaining !== 0 || Boolean(registration?.waitlistEnabled));
  const firstPickable = tickets.find(canPick)?.id ?? "";

  const [ticketId, setTicketId] = React.useState(firstPickable);
  const [values, setValues] = React.useState<Fields>({
    firstName: defaults?.firstName ?? "",
    lastName: defaults?.lastName ?? "",
    email: defaults?.email ?? "",
    phoneNumber: defaults?.phoneNumber ?? "",
  });
  const [submitted, setSubmitted] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const [outcome, setOutcome] = React.useState<
    RegistrationOutcomeResponse | string | null
  >(null);
  const [cancelled, setCancelled] = React.useState(false);

  const missing = {
    firstName: !values.firstName.trim(),
    lastName: !values.lastName.trim(),
    email: !emailLooksValid(values.email),
  };
  const set =
    (field: keyof Fields) => (change: { target: { value: string } }) =>
      setValues({ ...values, [field]: change.target.value });

  const chosen = tickets.find((ticket) => ticket.id === ticketId);
  const joinsTheWaitlist = chosen?.remaining === 0;

  const submit = async (change: React.FormEvent) => {
    change.preventDefault();
    setSubmitted(true);
    if (!ticketId || missing.firstName || missing.lastName || missing.email) {
      return;
    }
    setSending(true);
    try {
      setOutcome(await onRegister({ ticketTypeId: ticketId, ...values }));
    } finally {
      setSending(false);
    }
  };

  const cancel = async (cancelCode: string) => {
    setCancelling(true);
    try {
      if (await onCancel(cancelCode)) setCancelled(true);
    } finally {
      setCancelling(false);
    }
  };

  const done = typeof outcome === "object" && outcome !== null;
  const hasPlace = Boolean(event.registrationStatus) && !done;
  const kind = event.isACourse ? "curso" : "evento";

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
        {hasPlace && event.registrationStatus && (
          <Alert severity="success">
            Ya tiene un lugar en este {kind}:{" "}
            {stateLabel[event.registrationStatus as keyof typeof stateLabel]}.
            Si tiene cuenta, encuentre su ticket en «Mi espacio».
          </Alert>
        )}
        {registration && !registration.open && !done && !hasPlace && (
          <Alert severity="info">La inscripción está cerrada.</Alert>
        )}
        {typeof outcome === "string" && (
          <Alert severity="error">{outcome}</Alert>
        )}
        {done && !cancelled && (
          <Stack spacing={2}>
            <Alert
              severity={outcome.status === "WAITLISTED" ? "info" : "success"}
            >
              {outcome.alreadyRegistered
                ? `Ya estaba inscrito con ese correo: ${stateLabel[outcome.status as keyof typeof stateLabel]}.`
                : outcome.status === "WAITLISTED"
                  ? "Quedó en lista de espera. Si se libera un lugar, quedará confirmado."
                  : "Listo, quedó inscrito. Gracias."}
            </Alert>
            {outcome.status === "CONFIRMED" && outcome.ticketCode && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={1} alignItems="center">
                  <Typography variant="h6" component="h2">
                    Su ticket
                  </Typography>
                  <QrImage
                    value={outcome.ticketCode}
                    label="QR de su ticket"
                    size={200}
                  />
                  <Typography variant="body2" color="text.secondary">
                    Muéstrelo al entrar.
                  </Typography>
                </Stack>
              </Paper>
            )}
            {outcome.cancelCode && (
              <Stack
                spacing={1}
                aria-label="Cancelar la inscripción"
                role="group"
              >
                <Typography variant="body2" color="text.secondary">
                  Guarde este enlace: con él puede cancelar su inscripción sin
                  iniciar sesión.
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    label="Enlace para cancelar"
                    size="small"
                    value={cancelLink(outcome.cancelCode)}
                    slotProps={{ input: { readOnly: true } }}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    onClick={() => onCopy(cancelLink(outcome.cancelCode ?? ""))}
                  >
                    Copiar enlace
                  </Button>
                </Stack>
                <LoadingButton
                  variant="outlined"
                  loading={cancelling}
                  onClick={() => cancel(outcome.cancelCode ?? "")}
                  sx={{ alignSelf: "flex-start" }}
                >
                  Cancelar mi inscripción
                </LoadingButton>
              </Stack>
            )}
          </Stack>
        )}
        {cancelled && <Alert severity="info">Su inscripción se canceló.</Alert>}
        {event.canRegister && !done && !hasPlace && (
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
            <FormControl>
              <FormLabel id="ticket-choice">Tipo de ticket</FormLabel>
              <RadioGroup
                aria-labelledby="ticket-choice"
                value={ticketId}
                onChange={(change) => setTicketId(change.target.value)}
              >
                {tickets.map((ticket) => (
                  <FormControlLabel
                    key={ticket.id}
                    value={ticket.id}
                    disabled={!canPick(ticket)}
                    control={<Radio />}
                    label={[
                      ticket.name,
                      formatPrice(ticket.priceCents, ticket.currency),
                      ticket.onSale
                        ? remainingLabel(ticket.remaining)
                        : "Venta cerrada",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                ))}
              </RadioGroup>
            </FormControl>
            {joinsTheWaitlist && (
              <Alert severity="info">
                Los lugares de este ticket se agotaron. Puede anotarse en la
                lista de espera.
              </Alert>
            )}
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
              {joinsTheWaitlist
                ? "Anotarme en la lista de espera"
                : "Inscribirme"}
            </LoadingButton>
          </Stack>
        )}
        {registration?.open &&
          registration.requiresAccount &&
          !signedIn &&
          !done && (
            <Alert
              severity="info"
              action={
                onSignIn && (
                  <Button color="inherit" onClick={onSignIn}>
                    Iniciar sesión
                  </Button>
                )
              }
            >
              Para inscribirse en este {kind} necesita iniciar sesión con su
              correo.
            </Alert>
          )}
      </Stack>
    </Container>
  );
};
