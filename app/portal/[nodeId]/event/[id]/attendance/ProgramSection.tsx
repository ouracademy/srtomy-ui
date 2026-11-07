"use client";

import { deleteEventsById } from "@/app/(api)/generated";
import type {
  ChildResponse,
  EventResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { isSameDay } from "date-fns";
import { useContext, useState } from "react";
import { savedMessage } from "./EditableEventForm";
import { moveSubEvent } from "./moveSubEvent";
import { ProgramCalendar } from "./ProgramCalendar";
import { ProgramList } from "./ProgramList";
import { SessionPopover } from "./SessionPopover";
import { SubEventDialog } from "./SubEventDialog";

type ProgramSectionProps = Readonly<{
  nodeId: string;
  event: EventResponse;
  // Whoever may add and change sessions (`events.write`).
  canAdd: boolean;
  // Whoever may set up the sign-up of a sub-event with its own.
  canConfigureRegistration: boolean;
  // A sub-event was added, so the event is read again.
  onChanged: () => void;
}>;

// The program of an event: a calendar of its days where sessions (events and
// courses) are made by dragging over free hours and moved by dragging them. It
// is optional and starts closed when there is none and the event lasts a day.
export const ProgramSection = ({
  nodeId,
  event,
  canAdd,
  canConfigureRegistration,
  onChanged,
}: ProgramSectionProps) => {
  const alert = useContext(SnackbarContext);
  const sessions = event.children ?? [];
  const oneDay =
    event.start && event.end ? isSameDay(event.start, event.end) : false;
  const [expanded, setExpanded] = useState(sessions.length > 0 || !oneDay);
  const [adding, setAdding] = useState<{ start: Date; end: Date } | "free">();
  const [picked, setPicked] = useState<{
    id: string;
    element: HTMLElement;
  } | null>(null);
  const [removing, setRemoving] = useState<ChildResponse | null>(null);
  const [showList, setShowList] = useState(false);
  const pickedSession = sessions.find((item) => item.id === picked?.id) ?? null;

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
  if (sessions.length === 0 && !canAdd) return null;

  return (
    <Accordion
      variant="outlined"
      expanded={expanded}
      onChange={(_, open) => setExpanded(open)}
      disableGutters
      sx={{ borderRadius: 4, "&:before": { display: "none" } }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="program-content"
        id="program-header"
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="h6" component="h2" fontWeight={700}>
            Programa
          </Typography>
          <Chip
            size="small"
            label={
              sessions.length === 0
                ? "Sin sesiones todavía"
                : sessions.length === 1
                  ? "1 sesión"
                  : `${sessions.length} sesiones`
            }
          />
        </Stack>
      </AccordionSummary>
      <AccordionDetails id="program-content">
        <Stack spacing={2}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            useFlexGap
            spacing={1}
          >
            <Typography variant="body2" color="text.secondary">
              {canAdd
                ? "Arrastra sobre un día para crear una sesión. Arrástrala o estírala para moverla. Púlsala para ver sus opciones."
                : "Las sesiones del evento, por día y hora."}
            </Typography>
            {canAdd && (
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => setAdding("free")}
              >
                Agregar sub-evento
              </Button>
            )}
          </Stack>
          {event.start && event.end && (
            <ProgramCalendar
              start={event.start}
              end={event.end}
              items={sessions}
              canMove={canAdd}
              onMove={move}
              onCreate={(start, end) => setAdding({ start, end })}
              onPick={(id, element) => setPicked({ id, element })}
            />
          )}
          {sessions.length > 0 && (
            <div>
              <Button
                size="small"
                aria-expanded={showList}
                onClick={() => setShowList((current) => !current)}
              >
                {showList ? "Ocultar la lista" : "Ver como lista"}
              </Button>
              {showList && (
                <ProgramList
                  nodeId={nodeId}
                  sessions={sessions}
                  canEdit={canAdd}
                  onRemove={setRemoving}
                />
              )}
            </div>
          )}
        </Stack>
      </AccordionDetails>
      <SessionPopover
        nodeId={nodeId}
        session={pickedSession}
        anchor={picked?.element ?? null}
        close={() => setPicked(null)}
        canEdit={canAdd}
        onRemove={setRemoving}
      />
      <DialogDeleteConfirmation
        open={Boolean(removing)}
        close={() => setRemoving(null)}
        onDelete={remove}
        title={`¿Eliminar «${removing?.title ?? ""}»?`}
        message="Se avisará por correo a quienes estén inscritos. Recuerda que una vez eliminado no podrás recuperarlo."
      />
      {adding && (
        <SubEventDialog
          nodeId={nodeId}
          parent={event}
          open
          close={() => setAdding(undefined)}
          created={onChanged}
          showRegistration={canConfigureRegistration}
          initialRange={adding === "free" ? undefined : adding}
        />
      )}
    </Accordion>
  );
};
