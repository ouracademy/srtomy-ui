"use client";

import { useGetEventsByIdAttendanceSummary } from "@/app/(api)/generated";
import { Chip, Stack, Typography } from "@mui/material";

type AttendanceTotalProps = Readonly<{ eventId: string }>;

const people = (count: number) => (count === 1 ? "persona" : "personas");

// How many came to the event, counting each person once: whoever is marked in
// the list, whoever came in with a ticket without being in it, and the
// visitors without a name.
export const AttendanceTotal = ({ eventId }: AttendanceTotalProps) => {
  const { data } = useGetEventsByIdAttendanceSummary(eventId, {
    swr: { refreshInterval: 15000 },
  });
  if (!data) return null;
  const total = data.total ?? 0;

  return (
    <Stack spacing={1} aria-label="Total de asistentes">
      <Typography variant="subtitle1">
        {total === 0
          ? "Aún no asistió nadie."
          : `${total === 1 ? "Asistió" : "Asistieron"} ${total} ${people(total)}`}
      </Typography>
      {total > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`En la lista: ${data.people ?? 0}`} />
          <Chip
            size="small"
            label={`Solo con ticket: ${data.ticketOnly ?? 0}`}
          />
          <Chip size="small" label={`Visitantes: ${data.guests ?? 0}`} />
        </Stack>
      )}
    </Stack>
  );
};
