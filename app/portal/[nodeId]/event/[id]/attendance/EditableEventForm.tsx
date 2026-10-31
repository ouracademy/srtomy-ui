"use client";

import type {
  EditEventResponse,
  EventResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { putEventsById } from "@/app/(api)/generated";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { EventDetailFormData, EventForm } from "@/app/(components)/EventForm";
import { fromRecurrenceResponse } from "@/app/(components)/recurrence";
import { noRegistration } from "@/app/(components)/registration";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { Button, Stack } from "@mui/material";
import { useContext, useMemo, useState } from "react";
import { fullName } from "../../../person/PersonTable";
import { EditEventDialog } from "./EditEventDialog";
import {
  describeChange,
  STOP_REPEATING_MESSAGE,
  toEditRequest,
  type EditOption,
} from "./eventChange";

type EditableEventFormProps = Readonly<{
  nodeId: string;
  eventId: string;
  event: EventResponse;
  // Read-only until the user asks to edit.
  editing: boolean;
  cancel: () => void;
  saved: (result: EditEventResponse) => void;
}>;

// What the API answers, in a sentence for the snackbar.
export const savedMessage = (result: EditEventResponse): string => {
  const parts = ["Evento actualizado."];
  if (result.notifiedPeople) {
    parts.push(
      `Se avisó por correo a ${result.notifiedPeople} ${result.notifiedPeople === 1 ? "persona" : "personas"}.`,
    );
  }
  if (result.keptEvents) {
    parts.push(
      `${result.keptEvents} ${result.keptEvents === 1 ? "evento" : "eventos"} con inscritos, asistencia o ya pasados no cambiaron.`,
    );
  }
  return parts.join(" ");
};

// The form of an event: read-only, or editing it and saving with PUT
// /events/{id}. Before saving it says what the change will cause and, for an
// event of a series, which occurrences it reaches.
export const EditableEventForm = ({
  nodeId,
  eventId,
  event,
  editing,
  cancel,
  saved,
}: EditableEventFormProps) => {
  const alert = useContext(SnackbarContext);
  const repeats = Boolean(event.recurrence);
  const [pending, setPending] = useState<EventDetailFormData | null>(null);

  const initialValues = useMemo<EventDetailFormData>(
    () => ({
      name: event.title ?? "",
      date: event.start ?? new Date(),
      startTime: event.start ?? new Date(),
      endTime: event.end ?? new Date(),
      recurrence: fromRecurrenceResponse(event.recurrence),
      type: event.isACourse ? 1 : 0,
      address: event.address,
      speakers: (event.speakers ?? []).map((speaker) => ({
        id: speaker.id ?? "",
        label: fullName(speaker),
      })),
      description: event.description,
      // Shown and changed in its own panel, not in this form.
      registration: noRegistration(),
    }),
    [event],
  );

  const save = async (values: EventDetailFormData, option: EditOption) => {
    try {
      const result = await putEventsById(
        eventId,
        toEditRequest({
          nodeId,
          initial: initialValues,
          values,
          option,
          repeats,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      );
      setPending(null);
      alert.showMessage(savedMessage(result));
      saved(result);
    } catch (error) {
      setPending(null);
      alert.showMessage(
        apiErrorMessage(
          error,
          "No se pudo guardar el evento. Intenta de nuevo.",
        ),
      );
    }
  };

  const submit = async (values: EventDetailFormData) => {
    const change = describeChange(initialValues, values);
    if (
      repeats &&
      change.ruleChanged &&
      values.recurrence.frequency === "NONE"
    ) {
      alert.showMessage(STOP_REPEATING_MESSAGE);
      return;
    }
    if (
      !repeats &&
      !change.scheduleMoved &&
      !change.detailsChanged &&
      !change.ruleChanged
    ) {
      await save(values, "THIS_EVENT");
      return;
    }
    // A series asks which occurrences; a single event whose schedule or details
    // change asks to confirm because of the emails.
    setPending(values);
  };

  const change = pending ? describeChange(initialValues, pending) : null;

  return (
    <>
      <EventForm
        // A new form (the saved or the discarded data) each time it opens.
        key={`${editing}-${event.lastModifiedDate?.toString() ?? ""}`}
        nodeId={nodeId}
        initialValues={initialValues}
        submit={submit}
        editable={editing}
        lockType
      />
      {editing && (
        <Stack
          direction="row"
          sx={{
            justifyContent: "flex-end",
            px: 4,
          }}
        >
          <Button onClick={cancel}>Cancelar</Button>
        </Stack>
      )}
      {change && (
        <EditEventDialog
          open
          repeats={repeats}
          change={change}
          close={() => setPending(null)}
          onConfirm={(option) => save(pending as EventDetailFormData, option)}
        />
      )}
    </>
  );
};
