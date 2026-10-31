"use client";

import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { groupByDay } from "@/app/(components)/groupByDay";
import { describeRegistrationMode } from "@/app/(components)/registrationMode";
import AddIcon from "@mui/icons-material/Add";
import {
  Button,
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
import { useState } from "react";
import { SubEventDialog } from "./SubEventDialog";

type ProgramSectionProps = Readonly<{
  nodeId: string;
  event: EventResponse;
  // Whoever may add sub-events (`events.write`).
  canAdd: boolean;
  // Whoever may set up the sign-up of a sub-event with its own.
  canConfigureRegistration: boolean;
  // A sub-event was added, so the event is read again.
  onChanged: () => void;
}>;

const hours = (start?: Date, end?: Date) =>
  start && end ? `${format(start, "HH:mm")} a ${format(end, "HH:mm")}` : "";

// The program of an event: the events and courses that are part of it, day by
// day. It is optional: an event does not need one.
export const ProgramSection = ({
  nodeId,
  event,
  canAdd,
  canConfigureRegistration,
  onChanged,
}: ProgramSectionProps) => {
  const [adding, setAdding] = useState(false);
  const days = groupByDay(event.children ?? []);

  // Nothing to show to someone who cannot add to an event that has no program.
  if (days.length === 0 && !canAdd) return null;

  return (
    <Paper
      component="section"
      aria-label="Programa"
      variant="outlined"
      sx={{ p: 2 }}
    >
      <Stack spacing={2}>
        <Typography variant="h6">Programa</Typography>
        {days.length === 0 && (
          <Typography color="text.secondary">
            Es opcional: agrega los eventos y cursos que forman parte de «
            {event.title}», por ejemplo las charlas de cada día.
          </Typography>
        )}
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
                <ListItem key={item.id} disablePadding>
                  <ListItemButton
                    component={NextLink}
                    href={`/portal/${nodeId}/event/${item.id}/attendance`}
                  >
                    <ListItemText
                      primary={item.title}
                      secondary={hours(item.start, item.end)}
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
                        label={
                          describeRegistrationMode(item.registrationMode)
                            ?.summary
                        }
                      />
                    </Stack>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </div>
        ))}
        {canAdd && (
          <div>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setAdding(true)}
            >
              Agregar sub-evento
            </Button>
          </div>
        )}
      </Stack>
      <SubEventDialog
        nodeId={nodeId}
        parent={event}
        open={adding}
        close={() => setAdding(false)}
        created={onChanged}
        showRegistration={canConfigureRegistration}
      />
    </Paper>
  );
};
