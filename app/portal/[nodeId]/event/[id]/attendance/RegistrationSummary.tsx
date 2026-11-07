"use client";

import LoadingButton from "@mui/lab/LoadingButton";
import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { formatPrice } from "@/app/(components)/registration";
import { RegistrationSetupDialog } from "./RegistrationSetupDialog";
import { useRegistration, type RegistrationActions } from "./useRegistration";

type RegistrationSummaryProps = Readonly<{
  eventId: string;
  title: string;
  // The sub-events of the program: a ticket can give access to only some.
  subEvents?: readonly { id: string; title: string }[];
  can: RegistrationActions;
}>;

const Line = ({ label, value }: Readonly<{ label: string; value: string }>) => (
  <Stack direction="row" justifyContent="space-between" spacing={2}>
    <Typography color="text.secondary">{label}</Typography>
    <Typography fontWeight={700} textAlign="right">
      {value}
    </Typography>
  </Stack>
);

// How the sign-up is set up, at a glance: whether it is open, how many are
// confirmed and what each ticket costs and has sold. The side column of the
// event; who signed up is listed apart.
export const RegistrationSummary = ({
  eventId,
  title,
  subEvents,
  can,
}: RegistrationSummaryProps) => {
  const registration = useRegistration(eventId);
  const [configuring, setConfiguring] = useState(false);
  const [changingOpen, setChangingOpen] = useState(false);
  const { setup } = registration;

  if (!setup && registration.setupError) {
    return (
      <ResourceError
        error={registration.setupError}
        onRetry={registration.retry}
      />
    );
  }
  if (!setup) return <Loading />;

  const toggleOpen = async () => {
    setChangingOpen(true);
    try {
      await registration.setOpen(!setup.open);
    } catch {
      // Already explained to the user.
    } finally {
      setChangingOpen(false);
    }
  };

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-label="Inscripción"
      sx={{ p: 2.5, borderRadius: 4 }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Typography variant="h6" component="h2" fontWeight={700}>
            Inscripción
          </Typography>
          {setup.enabled && (
            <Chip
              size="small"
              color={setup.open ? "success" : "default"}
              label={setup.open ? "Abierta" : "Cerrada"}
            />
          )}
        </Stack>
        {setup.enabled ? (
          <Stack spacing={1}>
            <Line label="Confirmados" value={String(setup.confirmed ?? 0)} />
            <Line label="Ingresaron" value={String(setup.checkedIn ?? 0)} />
            {(setup.tickets ?? []).map((ticket) => (
              <Line
                key={ticket.id}
                label={ticket.name ?? ""}
                value={[
                  formatPrice(ticket.priceCents, ticket.currency),
                  ticket.quantity
                    ? `${ticket.sold ?? 0} de ${ticket.quantity}`
                    : `${ticket.sold ?? 0}`,
                ].join(" · ")}
              />
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">
            Este evento no pide inscripción: cualquiera puede venir.
          </Typography>
        )}
        {setup.enabled && !setup.open && (
          <Typography variant="body2" color="text.secondary">
            Las inscripciones están cerradas: nadie más puede anotarse.
          </Typography>
        )}
        <Stack spacing={1}>
          {setup.enabled && can.close && (
            <LoadingButton
              variant="outlined"
              loading={changingOpen}
              onClick={toggleOpen}
            >
              {setup.open ? "Cerrar inscripciones" : "Reabrir inscripciones"}
            </LoadingButton>
          )}
          {can.configure && (
            <Button variant="outlined" onClick={() => setConfiguring(true)}>
              {setup.enabled ? "Configurar inscripción" : "Activar inscripción"}
            </Button>
          )}
        </Stack>
      </Stack>
      {configuring && (
        <RegistrationSetupDialog
          open
          close={() => setConfiguring(false)}
          title={title}
          setup={setup}
          subEvents={subEvents}
          onSave={registration.save}
        />
      )}
    </Paper>
  );
};
