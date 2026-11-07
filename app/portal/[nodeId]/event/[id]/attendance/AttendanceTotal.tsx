"use client";

import { useGetEventsByIdAttendanceSummary } from "@/app/(api)/generated";
import { Box, Paper, Stack, Typography } from "@mui/material";

type AttendanceTotalProps = Readonly<{
  eventId: string;
  // How many people are signed up to come; unknown when the event has no
  // sign-up.
  expected?: number;
}>;

const parts = [
  { key: "people", label: "En la lista", color: "#2563EB" },
  { key: "ticketOnly", label: "Solo con ticket", color: "#7C3AED" },
  { key: "guests", label: "Visitantes", color: "#F59E0B" },
] as const;

// How many came to the event, counting each person once: whoever is marked in
// the list, whoever came in with a ticket without being in it, and the
// visitors without a name. A bar shows how the total is made up.
export const AttendanceTotal = ({
  eventId,
  expected,
}: AttendanceTotalProps) => {
  const { data } = useGetEventsByIdAttendanceSummary(eventId, {
    swr: { refreshInterval: 15000 },
  });
  if (!data) return null;
  const total = data.total ?? 0;
  // The bar is as wide as the expected people, or as the total when nobody
  // was expected or more came than were expected.
  const whole = Math.max(total, expected ?? 0, 1);

  return (
    <Paper
      component="section"
      variant="outlined"
      aria-label="Total de asistentes"
      sx={{ p: 3, borderRadius: 5 }}
    >
      <Stack
        direction="row"
        useFlexGap
        sx={{
          flexWrap: "wrap",
          alignItems: "center",
          gap: "24px 40px",
        }}
      >
        <Stack spacing={0.5}>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
            }}
          >
            {total === 1 ? "Asistió" : "Asistieron"}
          </Typography>
          <Typography
            component="p"
            sx={{ fontSize: 56, lineHeight: 1, fontWeight: 700 }}
          >
            {total}
            {expected ? (
              <Typography
                component="span"
                sx={{
                  color: "text.secondary",
                  fontSize: 20,
                  fontWeight: 500,
                  ml: 1,
                }}
              >
                de {expected} esperados
              </Typography>
            ) : null}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
            }}
          >
            Cada persona cuenta una sola vez.
          </Typography>
        </Stack>
        <Stack spacing={1.25} sx={{ flex: "1 1 280px" }}>
          <Box
            aria-hidden
            sx={{
              height: 12,
              borderRadius: 999,
              bgcolor: "#E2E8F0",
              overflow: "hidden",
              display: "flex",
            }}
          >
            {parts.map(({ key, color }) => (
              <Box
                key={key}
                sx={{
                  width: `${((data[key] ?? 0) / whole) * 100}%`,
                  bgcolor: color,
                }}
              />
            ))}
          </Box>
          <Stack
            direction="row"
            useFlexGap
            sx={{
              flexWrap: "wrap",
              gap: "8px 16px",
            }}
          >
            {parts.map(({ key, label, color }) => (
              <Stack
                key={key}
                direction="row"
                spacing={0.75}
                sx={{
                  alignItems: "center",
                }}
              >
                <Box
                  aria-hidden
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "3px",
                    bgcolor: color,
                  }}
                />
                <Typography variant="body2">
                  {label}: {data[key] ?? 0}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
};
