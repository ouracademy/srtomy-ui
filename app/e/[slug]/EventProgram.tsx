import type { ProgramItemResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { sharedEventPath } from "@/app/(components)/eventSharing";
import { groupByDay } from "@/app/(components)/groupByDay";
import {
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import NextLink from "next/link";

type EventProgramProps = Readonly<{
  program: readonly ProgramItemResponse[];
}>;

// How a visitor gets into a sub-event, from what the ticket of the event gives.
export const entryLabel = (item: ProgramItemResponse) => {
  if (item.registrationMode === "OPEN") return "Sin inscripción";
  return item.includedInTicket
    ? "Incluido en tu inscripción"
    : "Con inscripción aparte";
};

// The events and courses that are part of an event, day by day, each with how
// to get into it. Shown to whoever can open them.
export const EventProgram = ({ program }: EventProgramProps) => {
  const days = groupByDay(program);
  if (days.length === 0) return null;

  return (
    <Paper
      component="section"
      aria-label="Programa"
      variant="outlined"
      sx={{ p: 2 }}
    >
      <Stack spacing={2}>
        <Typography variant="h6" component="h2">
          Programa
        </Typography>
        {days.map(({ day, items }) => (
          <div key={day.toISOString()}>
            <Typography
              variant="subtitle2"
              sx={{ textTransform: "capitalize" }}
            >
              {format(day, "EEEE d 'de' MMMM", { locale: es })}
            </Typography>
            <List dense disablePadding>
              {items.map((item) => (
                <ListItem key={item.slug} disablePadding>
                  <ListItemButton
                    component={NextLink}
                    href={sharedEventPath(item.slug ?? "")}
                  >
                    <ListItemText
                      primary={item.title}
                      secondary={
                        item.start && item.end
                          ? `${format(item.start, "HH:mm")} a ${format(item.end, "HH:mm")}`
                          : undefined
                      }
                    />
                    <Stack direction="row" spacing={1}>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={item.isACourse ? "Curso" : "Evento"}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={entryLabel(item)}
                      />
                    </Stack>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </div>
        ))}
      </Stack>
    </Paper>
  );
};
