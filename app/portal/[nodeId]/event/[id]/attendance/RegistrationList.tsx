"use client";

import { Button, Paper, Stack, Typography } from "@mui/material";
import type {
  EventRegistrationResponse,
  TicketSetup,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { formatPrice } from "@/app/(components)/registration";
import { useRegistration, type RegistrationActions } from "./useRegistration";

type RegistrationListProps = Readonly<{
  eventId: string;
  // The sub-events of the program, to name what a ticket gives access to.
  subEvents?: readonly { id: string; title: string }[];
  can: RegistrationActions;
}>;

const timeOf = (value?: Date) =>
  value
    ? new Date(value).toLocaleTimeString("es-PE", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// "98 de 150 · S/ 80 · da acceso a: Taller".
const ticketLine = (
  ticket: TicketSetup,
  subEvents: readonly { id: string; title: string }[],
) => {
  const access = (ticket.subEventIds ?? [])
    .map((id) => subEvents.find((item) => item.id === id)?.title)
    .filter(Boolean);
  return [
    ticket.quantity
      ? `${ticket.sold ?? 0} de ${ticket.quantity}`
      : `${ticket.sold ?? 0}`,
    formatPrice(ticket.priceCents, ticket.currency),
    access.length > 0 ? `da acceso a: ${access.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
};

// Who signed up, one card per ticket: their name, whether they came in and the
// buttons to mark it or to take them out. Only when the event has a sign-up.
export const RegistrationList = ({
  eventId,
  subEvents = [],
  can,
}: RegistrationListProps) => {
  const { setup, registrations, checkIn, remove } = useRegistration(eventId);
  if (!setup?.enabled) return null;

  const tickets = setup.tickets ?? [];
  const byTicket = (name?: string) =>
    registrations.filter((item) => item.ticketName === name);
  // Someone with a ticket that was changed or removed after they signed up.
  const known = new Set(tickets.map((ticket) => ticket.name));
  const others = registrations.filter((item) => !known.has(item.ticketName));

  const person = (item: EventRegistrationResponse) => {
    const name = `${item.firstName} ${item.lastName}`;
    return (
      <Stack
        component="li"
        key={item.id}
        direction="row"
        flexWrap="wrap"
        alignItems="center"
        justifyContent="space-between"
        useFlexGap
        spacing={1}
        sx={{ py: 1, borderTop: "1px solid #EEF2F7" }}
      >
        <Stack>
          <Typography fontWeight={500}>{name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {[item.email, item.phoneNumber].filter(Boolean).join(" · ")}
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ color: item.checkedInAt ? "#14532D" : "text.secondary" }}
          >
            {item.checkedInAt
              ? `Ingresó a las ${timeOf(item.checkedInAt)}`
              : "Aún no"}
          </Typography>
          {can.checkIn && (
            <Button
              size="small"
              aria-label={
                item.checkedInAt
                  ? `Quitar el ingreso de ${name}`
                  : `Marcar el ingreso de ${name}`
              }
              onClick={() => checkIn(item.id ?? "", !item.checkedInAt)}
            >
              {item.checkedInAt ? "Quitar ingreso" : "Marcar ingreso"}
            </Button>
          )}
          {can.remove && (
            <Button
              size="small"
              aria-label={`Quitar la inscripción de ${name}`}
              onClick={() => remove(item.id ?? "")}
            >
              Quitar
            </Button>
          )}
        </Stack>
      </Stack>
    );
  };

  const group = (
    key: string,
    name: string,
    line: string | null,
    items: EventRegistrationResponse[],
  ) => (
    <Stack key={key} spacing={0.5}>
      <Typography fontWeight={700}>{name}</Typography>
      {line && (
        <Typography variant="body2" color="text.secondary">
          {line}
        </Typography>
      )}
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Aún no hay inscritos.
        </Typography>
      ) : (
        <Stack component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
          {items.map(person)}
        </Stack>
      )}
    </Stack>
  );

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-label="Inscritos"
      sx={{ p: 3, borderRadius: 4 }}
    >
      <Stack spacing={2.5}>
        <Stack
          direction="row"
          alignItems="baseline"
          justifyContent="space-between"
          spacing={2}
        >
          <Typography variant="h6" component="h2" fontWeight={700}>
            Inscritos
          </Typography>
          <Typography color="text.secondary">
            {setup.confirmed ?? 0} confirmados
          </Typography>
        </Stack>
        {tickets.map((ticket) =>
          group(
            ticket.id ?? ticket.name ?? "",
            ticket.name ?? "",
            ticketLine(ticket, subEvents),
            byTicket(ticket.name),
          ),
        )}
        {others.length > 0 && group("others", "Otros", null, others)}
      </Stack>
    </Paper>
  );
};
