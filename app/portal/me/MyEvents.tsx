"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import {
  Alert,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import NextLink from "next/link";
import React from "react";
import type { MyEventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { QrImage } from "@/app/(components)/QrImage";
import { sharedEventPath } from "@/app/(components)/eventSharing";

type MyEventsProps = Readonly<{
  events: MyEventResponse[];
  // Cancels the sign-up with its code; resolves when it was cancelled.
  onCancel: (cancelCode: string) => Promise<void>;
}>;

const details = (event: MyEventResponse) =>
  [
    event.isACourse ? "Curso" : "Evento",
    event.organizationName,
    event.start
      ? format(event.start, "d 'de' MMMM yyyy", { locale: es })
      : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

// "Mis eventos y cursos", in two plain lists. "Tengo lugar": where the user
// signed up (by their account or their verified email) and has not gone yet;
// they can show the ticket or give the place up. "Asistí": where they were
// marked as present. An event is in only one of them. What other people shared
// with them is a separate section ("Compartidos contigo").
export const MyEvents = ({ events, onCancel }: MyEventsProps) => {
  const withPlace = events.filter(
    (event) => event.registered && !event.attended,
  );
  const attended = events.filter((event) => event.attended);

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2 }}
      component="section"
      aria-label="Mis eventos y cursos"
    >
      <Typography variant="h6" component="h2">
        Mis eventos y cursos
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Aquí están los eventos y cursos donde tienes un lugar y a los que ya
        asististe.
      </Typography>
      {events.length === 0 && (
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Aún no te has inscrito ni has asistido a un evento o curso.
        </Typography>
      )}
      {withPlace.length > 0 && (
        <>
          <Typography variant="subtitle1" component="h3" sx={{ mt: 2 }}>
            Tengo lugar
          </Typography>
          <List aria-label="Tengo lugar">
            {withPlace.map((event) => (
              <PlaceItem key={event.slug} event={event} onCancel={onCancel} />
            ))}
          </List>
        </>
      )}
      {attended.length > 0 && (
        <>
          <Typography variant="subtitle1" component="h3" sx={{ mt: 2 }}>
            Asistí
          </Typography>
          <List aria-label="Asistí">
            {attended.map((event) => (
              <ListItem key={event.slug} disableGutters>
                <ListItemText
                  primary={
                    <NextLink href={sharedEventPath(event.slug ?? "")}>
                      {event.title}
                    </NextLink>
                  }
                  secondary={
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      useFlexGap
                      component="span"
                    >
                      <span>{details(event)}</span>
                      <Chip size="small" label="Asististe" />
                    </Stack>
                  }
                  slotProps={{ secondary: { component: "div" } }}
                />
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Paper>
  );
};

// An event where the user has a place: its ticket and a way to give it up.
const PlaceItem = ({
  event,
  onCancel,
}: Readonly<{
  event: MyEventResponse;
  onCancel: (cancelCode: string) => Promise<void>;
}>) => {
  const [showTicket, setShowTicket] = React.useState(false);
  const [asking, setAsking] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const confirmed = event.registrationStatus === "CONFIRMED";

  const cancel = async () => {
    setCancelling(true);
    try {
      await onCancel(event.cancelCode ?? "");
    } catch {
      // Already explained to the user.
    } finally {
      setCancelling(false);
      setAsking(false);
    }
  };

  return (
    <ListItem disableGutters sx={{ display: "block" }}>
      <ListItemText
        primary={
          <NextLink href={sharedEventPath(event.slug ?? "")}>
            {event.title}
          </NextLink>
        }
        secondary={
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            useFlexGap
            component="span"
          >
            <span>
              {[details(event), event.ticketName].filter(Boolean).join(" · ")}
            </span>
            {event.registrationStatus && (
              <Chip
                size="small"
                color={confirmed ? "success" : "default"}
                label="Confirmado"
              />
            )}
          </Stack>
        }
        slotProps={{ secondary: { component: "div" } }}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
        {confirmed && event.ticketCode && (
          <Button
            size="small"
            aria-label={`${showTicket ? "Ocultar" : "Ver"} mi ticket de ${event.title}`}
            onClick={() => setShowTicket(!showTicket)}
          >
            {showTicket ? "Ocultar ticket" : "Ver mi ticket"}
          </Button>
        )}
        {event.cancelCode && !asking && (
          <Button
            size="small"
            aria-label={`Cancelar mi inscripción a ${event.title}`}
            onClick={() => setAsking(true)}
          >
            Cancelar inscripción
          </Button>
        )}
      </Stack>
      {showTicket && event.ticketCode && (
        <Stack alignItems="flex-start" sx={{ mt: 1 }}>
          <QrImage
            value={event.ticketCode}
            label={`QR de mi ticket de ${event.title}`}
            size={180}
          />
          <Typography variant="body2" color="text.secondary">
            Muéstralo al entrar.
          </Typography>
        </Stack>
      )}
      {asking && (
        <Alert
          severity="warning"
          sx={{ mt: 1 }}
          action={
            <>
              <Button color="inherit" onClick={() => setAsking(false)}>
                No
              </Button>
              <LoadingButton
                color="inherit"
                loading={cancelling}
                onClick={cancel}
              >
                Sí, cancelar
              </LoadingButton>
            </>
          }
        >
          ¿Cancelar tu inscripción a «{event.title}»? Tu lugar quedará libre.
        </Alert>
      )}
    </ListItem>
  );
};
