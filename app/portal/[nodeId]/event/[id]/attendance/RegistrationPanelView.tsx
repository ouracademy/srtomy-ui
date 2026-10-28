"use client";

import {
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type {
  EventRegistrationResponse,
  EventRegistrationSetupResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { formatPrice } from "@/app/(components)/registration";

type RegistrationPanelViewProps = Readonly<{
  setup: EventRegistrationSetupResponse;
  registrations: EventRegistrationResponse[];
  // The ushers who take attendance can mark who came.
  canCheckIn: boolean;
  onConfigure: () => void;
  onCheckIn: (registrationId: string, checkedIn: boolean) => Promise<void>;
  onRemove: (registrationId: string) => Promise<void>;
}>;

const statusLabel = {
  CONFIRMED: "Confirmado",
  WAITLISTED: "En espera",
} as const;

const timeOf = (value?: Date) =>
  value
    ? new Date(value).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// The registration of an event as its organizers see it: how it is set up and
// who has a place, is waiting for one, or already came.
export const RegistrationPanelView = ({
  setup,
  registrations,
  canCheckIn,
  onConfigure,
  onCheckIn,
  onRemove,
}: RegistrationPanelViewProps) => (
  <Paper
    variant="outlined"
    sx={{ p: 2 }}
    component="section"
    aria-label="Inscripción"
  >
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="h6" component="h2" sx={{ flex: 1 }}>
          Inscripción
        </Typography>
        <Button variant="outlined" onClick={onConfigure}>
          {setup.enabled ? "Configurar inscripción" : "Activar inscripción"}
        </Button>
      </Stack>
      {!setup.enabled ? (
        <Typography color="text.secondary">
          Este evento no pide inscripción: cualquiera puede venir.
        </Typography>
      ) : (
        <>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              color={setup.open ? "success" : "default"}
              label={setup.open ? "Abierta" : "Cerrada"}
            />
            <Chip size="small" label={`Confirmados: ${setup.confirmed ?? 0}`} />
            {setup.waitlistEnabled && (
              <Chip
                size="small"
                label={`En espera: ${setup.waitlisted ?? 0}`}
              />
            )}
            <Chip size="small" label={`Ingresaron: ${setup.checkedIn ?? 0}`} />
            {setup.capacity ? (
              <Chip size="small" label={`Cupo total: ${setup.capacity}`} />
            ) : null}
          </Stack>
          <Table size="small" aria-label="Tickets">
            <TableHead>
              <TableRow>
                <TableCell>Ticket</TableCell>
                <TableCell>Precio</TableCell>
                <TableCell>Vendidos</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(setup.tickets ?? []).map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell>{ticket.name}</TableCell>
                  <TableCell>
                    {formatPrice(ticket.priceCents, ticket.currency)}
                  </TableCell>
                  <TableCell>
                    {ticket.quantity
                      ? `${ticket.sold ?? 0} de ${ticket.quantity}`
                      : (ticket.sold ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {registrations.length === 0 ? (
            <Typography color="text.secondary">
              Aún no hay inscritos.
            </Typography>
          ) : (
            <Table size="small" aria-label="Inscritos">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Contacto</TableCell>
                  <TableCell>Ticket</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Ingreso</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {registrations.map((item) => {
                  const name = `${item.firstName} ${item.lastName}`;
                  const confirmed = item.status === "CONFIRMED";
                  return (
                    <TableRow key={item.id}>
                      <TableCell>{name}</TableCell>
                      <TableCell>
                        {[item.email, item.phoneNumber]
                          .filter(Boolean)
                          .join(" · ")}
                      </TableCell>
                      <TableCell>{item.ticketName}</TableCell>
                      <TableCell>
                        {statusLabel[item.status as keyof typeof statusLabel]}
                      </TableCell>
                      <TableCell>
                        {item.checkedInAt
                          ? `Ingresó a las ${timeOf(item.checkedInAt)}`
                          : confirmed
                            ? "Aún no"
                            : "—"}
                      </TableCell>
                      <TableCell>
                        {canCheckIn && confirmed && (
                          <Button
                            size="small"
                            aria-label={
                              item.checkedInAt
                                ? `Quitar el ingreso de ${name}`
                                : `Marcar el ingreso de ${name}`
                            }
                            onClick={() =>
                              onCheckIn(item.id ?? "", !item.checkedInAt)
                            }
                          >
                            {item.checkedInAt
                              ? "Quitar ingreso"
                              : "Marcar ingreso"}
                          </Button>
                        )}
                        <Button
                          size="small"
                          aria-label={`Quitar la inscripción de ${name}`}
                          onClick={() => onRemove(item.id ?? "")}
                        >
                          Quitar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </>
      )}
    </Stack>
  </Paper>
);
