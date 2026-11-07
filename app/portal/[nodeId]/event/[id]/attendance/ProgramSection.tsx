"use client";

import type {
  ChildResponse,
  EventResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { groupByDay } from "@/app/(components)/groupByDay";
import { describeRegistrationMode } from "@/app/(components)/registrationMode";
import { deleteEventsById } from "@/app/(api)/generated";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import NextLink from "next/link";
import { useContext, useState } from "react";
import { moveSubEvent } from "./moveSubEvent";
import { ProgramCalendar } from "./ProgramCalendar";
import { savedMessage } from "./EditableEventForm";
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
  const alert = useContext(SnackbarContext);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<ChildResponse | null>(null);
  const [expanded, setExpanded] = useState(true);
  // An event of one day does not need a program: it starts as a button.
  const [building, setBuilding] = useState(false);
  const days = groupByDay(event.children ?? []);
  const hasProgram = days.length > 0;

  const move = async (id: string, start: Date, end: Date) => {
    try {
      alert.showMessage(savedMessage(await moveSubEvent(id, start, end)));
      onChanged();
    } catch (error) {
      alert.showMessage(
        apiErrorMessage(error, "No se pudo mover. Intenta de nuevo."),
      );
      throw error;
    }
  };

  const remove = async () => {
    if (!removing?.id) return;
    try {
      await deleteEventsById(removing.id, { option: "THIS_EVENT" });
      alert.showMessage(`Se eliminó «${removing.title}».`);
      setRemoving(null);
      onChanged();
    } catch (error) {
      alert.showMessage(
        apiErrorMessage(error, "No se pudo eliminar. Intenta de nuevo."),
      );
    }
  };

  // Nothing to show to someone who cannot add to an event that has no program.
  if (days.length === 0 && !canAdd) return null;
  const oneDay =
    event.start && event.end ? isSameDay(event.start, event.end) : false;
  if (days.length === 0 && oneDay && !building) {
    return (
      <div>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setBuilding(true)}
        >
          Armar un programa
        </Button>
      </div>
    );
  }

  return (
    <Accordion
      variant="outlined"
      expanded={expanded}
      onChange={(_, open) => setExpanded(open)}
      disableGutters
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="program-content"
        id="program-header"
      >
        <Typography variant="h6" component="h2">
          Programa
        </Typography>
      </AccordionSummary>
      <AccordionDetails id="program-content">
        <Stack spacing={2}>
          {hasProgram && event.start && event.end && (
            <ProgramCalendar
              nodeId={nodeId}
              start={event.start}
              end={event.end}
              items={event.children ?? []}
              canMove={canAdd}
              onMove={move}
            />
          )}
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
                  <ListItem
                    key={item.id}
                    disablePadding
                    secondaryAction={
                      canAdd && (
                        <Stack direction="row">
                          <Tooltip title="Editar">
                            <IconButton
                              component={NextLink}
                              href={`/portal/${nodeId}/event/${item.id}/attendance`}
                              aria-label={`Editar ${item.title}`}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              aria-label={`Eliminar ${item.title}`}
                              onClick={() => setRemoving(item)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )
                    }
                  >
                    <ListItemButton
                      sx={{ pr: canAdd ? 14 : undefined }}
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
      </AccordionDetails>
      <DialogDeleteConfirmation
        open={Boolean(removing)}
        close={() => setRemoving(null)}
        onDelete={remove}
        title={`¿Eliminar «${removing?.title ?? ""}»?`}
        message="Se avisará por correo a quienes estén inscritos. Recuerda que una vez eliminado no podrás recuperarlo."
      />
      <SubEventDialog
        nodeId={nodeId}
        parent={event}
        open={adding}
        close={() => setAdding(false)}
        created={onChanged}
        showRegistration={canConfigureRegistration}
      />
    </Accordion>
  );
};
