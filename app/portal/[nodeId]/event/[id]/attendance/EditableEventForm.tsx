"use client";

import type {
  EditEventResponse,
  EventResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { putEventsById, useGetEventsById } from "@/app/(api)/generated";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { EventDetailFormData, EventForm } from "@/app/(components)/EventForm";
import { fromRecurrenceResponse } from "@/app/(components)/recurrence";
import { noRegistration } from "@/app/(components)/registration";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { Alert, Box } from "@mui/material";
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
  saved: (result: EditEventResponse) => void;
}>;

// Said on the form, before anything is changed, so nobody is surprised.
const EMAIL_NOTICE =
  "Las personas inscritas recibirán un correo si cambia la fecha, la hora, el nombre, el lugar o los ponentes.";

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
  saved,
}: EditableEventFormProps) => {
  const alert = useContext(SnackbarContext);
  const repeats = Boolean(event.recurrence);
  const [pending, setPending] = useState<EventDetailFormData | null>(null);
  // A sub-event stays inside the dates of the event it is part of.
  const parentId = event.parentEventId;
  const { data: parent } = useGetEventsById(parentId ?? "", {
    swr: { enabled: Boolean(parentId) },
  });

  const initialValues = useMemo<EventDetailFormData>(
    () => ({
      name: event.title ?? "",
      date: event.start ?? new Date(),
      endDate: event.end ?? event.start ?? new Date(),
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
      // How a sub-event is entered; an event on its own has no such thing.
      requiresContainerRegistration: parentId
        ? Boolean(event.requiresContainerRegistration)
        : undefined,
      registrationMode: parentId
        ? (event.registrationMode ?? "INHERIT")
        : undefined,
      // Shown and changed in its own panel, not in this form.
      registration: noRegistration(),
    }),
    [event, parentId],
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
    // A series asks which occurrences it reaches, and ending the sign-ups of a
    // sub-event cancels them, so both ask first. Any other event saves right
    // away: the notice about the emails is already on the form.
    if (!repeats && !change.ownSignUpsEnd) {
      await save(values, "THIS_EVENT");
      return;
    }
    setPending(values);
  };

  const change = pending ? describeChange(initialValues, pending) : null;

  return (
    <>
      {editing && !repeats && (
        // Room on the right for the close button of the dialog.
        <Box sx={{ px: 4, pt: 6 }}>
          <Alert severity="info">{EMAIL_NOTICE}</Alert>
        </Box>
      )}
      <EventForm
        // A new form (the saved or the discarded data) each time it opens.
        key={`${editing}-${event.lastModifiedDate?.toString() ?? ""}`}
        nodeId={nodeId}
        initialValues={initialValues}
        submit={submit}
        editable={editing}
        lockType
        container={
          parent?.start && parent.end
            ? {
                title: parent.title ?? "",
                start: parent.start,
                end: parent.end,
              }
            : undefined
        }
      />
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
