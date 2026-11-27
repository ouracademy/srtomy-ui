"use client";

import { PhoneField } from "@/app/(components)/PhoneField";
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
import { EventNotices } from "./EventNotices";
import { EventProgram } from "./EventProgram";
import { ParentEventNotice } from "./ParentEventNotice";
import { initialPhase, phaseReducer } from "./registrationPhase";

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
    Boolean(ticket.onSale) && ticket.remaining !== 0;
  const firstPickable = tickets.find(canPick)?.id ?? "";

  const [ticketId, setTicketId] = React.useState(firstPickable);
  const [values, setValues] = React.useState<Fields>({
    firstName: defaults?.firstName ?? "",
    lastName: defaults?.lastName ?? "",
    email: defaults?.email ?? "",
    phoneNumber: defaults?.phoneNumber ?? "",
  });
  const [submitted, setSubmitted] = React.useState(false);
  const [phase, dispatch] = React.useReducer(phaseReducer, initialPhase);

  const missing = {
    firstName: !values.firstName.trim(),
    lastName: !values.lastName.trim(),
    email: !emailLooksValid(values.email),
  };
  const set =
    (field: keyof Fields) => (change: { target: { value: string } }) =>
      setValues({ ...values, [field]: change.target.value });

  const submit = async (change: React.FormEvent) => {
    change.preventDefault();
    setSubmitted(true);
    if (!ticketId || missing.firstName || missing.lastName || missing.email) {
      return;
    }
    dispatch({ type: "send" });
    try {
      dispatch({
        type: "answered",
        answer: await onRegister({ ticketTypeId: ticketId, ...values }),
      });
    } catch (error) {
      dispatch({ type: "abort" });
      throw error;
    }
  };

  const cancel = async (cancelCode: string) => {
    dispatch({ type: "cancel" });
    try {
      dispatch({ type: "cancelAnswered", worked: await onCancel(cancelCode) });
    } catch (error) {
      dispatch({ type: "abort" });
      throw error;
    }
  };

  const outcome = phase.kind === "registered" ? phase.outcome : undefined;
  const cancelled = phase.kind === "cancelled";
  const sending = phase.kind === "sending";
  const cancelling = phase.kind === "registered" && phase.cancelling;
  // They already hold a place, or just got one or gave it up: no form.
  const done = phase.kind === "registered" || cancelled;
  const hasPlace = Boolean(event.registrationStatus) && !done;
  const kind = event.isACourse ? "curso" : "evento";

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
        <EventNotices notices={event.notices ?? []} />
        {event.description && <Typography>{event.description}</Typography>}
        {event.container && (
          <ParentEventNotice
            container={event.container}
            signsUpThere={Boolean(registration) && !event.canRegister}
          />
        )}
        <EventProgram program={event.program ?? []} />
        {hasPlace && event.registrationStatus && (
          <Alert severity="success">
            Ya tiene un lugar en este {kind}. Si tiene cuenta, encuentre su
            ticket en «Mi espacio».
          </Alert>
        )}
        {registration && !registration.open && !done && !hasPlace && (
          <Alert severity="info">La inscripción está cerrada.</Alert>
        )}
        {phase.kind === "failed" && (
          <Alert severity="error">{phase.reason}</Alert>
        )}
        {outcome && (
          <Stack spacing={2}>
            <Alert severity="success">
              {outcome.alreadyRegistered
                ? "Ya estaba inscrito con ese correo."
                : "Listo, quedó inscrito. Gracias."}
            </Alert>
            {outcome.status === "CONFIRMED" && outcome.ticketCode && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack
                  spacing={1}
                  sx={{
                    alignItems: "center",
                  }}
                >
                  <Typography variant="h6" component="h2">
                    Su ticket
                  </Typography>
                  <QrImage
                    value={outcome.ticketCode}
                    label="QR de su ticket"
                    size={200}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                    }}
                  >
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
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                  }}
                >
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
        {registration?.open && registration.soldOut && !done && !hasPlace && (
          <Alert severity="info">Se agotaron los lugares.</Alert>
        )}
        {event.canRegister && !done && !hasPlace && !registration?.soldOut && (
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
            <PhoneField
              label="Teléfono"
              value={values.phoneNumber}
              onChange={(phoneNumber) => setValues({ ...values, phoneNumber })}
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
