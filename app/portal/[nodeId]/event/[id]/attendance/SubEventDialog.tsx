"use client";

import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { postEvents, putEventsByIdRegistration } from "@/app/(api)/generated";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import {
  EventForm,
  type EventDetailFormData,
} from "@/app/(components)/EventForm";
import { eventRange } from "@/app/(components)/eventRange";
import { noRecurrence } from "@/app/(components)/recurrence";
import {
  noRegistration,
  toSetupRequest,
} from "@/app/(components)/registration";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import CloseIcon from "@mui/icons-material/Close";
import { Dialog, IconButton } from "@mui/material";
import { addHours, format, min } from "date-fns";
import { useContext, useMemo, useState } from "react";

type SubEventDialogProps = Readonly<{
  nodeId: string;
  // The event the new one is part of.
  parent: EventResponse;
  open: boolean;
  close: () => void;
  // The sub-event was saved, so the program can be read again.
  created: () => void;
  // Offers to set up the sign-up of a sub-event that has its own.
  showRegistration: boolean;
}>;

// Adds a sub-event (an event or a course) to the program of an event. It stays
// inside the dates of its parent and is entered with the registration of its
// parent unless it says otherwise.
export const SubEventDialog = ({
  nodeId,
  parent,
  open,
  close,
  created,
  showRegistration,
}: SubEventDialogProps) => {
  const alert = useContext(SnackbarContext);
  // The dates of the parent (a missing one reads as now, once).
  const [now] = useState(() => new Date());
  const start = parent.start ?? now;
  const end = parent.end ?? start;

  const initialValues = useMemo<EventDetailFormData>(
    () => ({
      name: "",
      date: start,
      endDate: start,
      startTime: start,
      endTime: min([addHours(start, 1), end]),
      address: "",
      description: "",
      recurrence: noRecurrence(),
      type: 0,
      speakers: [],
      registrationMode: "INHERIT",
      registration: noRegistration(),
    }),
    [start, end],
  );

  const submit = async (values: EventDetailFormData) => {
    const range = eventRange(values);
    const mode = values.registrationMode ?? "INHERIT";
    let id: string;
    try {
      id = await postEvents({
        name: values.name,
        address: values.address,
        description: values.description,
        // The same node as its parent, or one below it.
        organizationId: parent.organization?.id ?? nodeId,
        startTime: format(range.start, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        endTime: format(range.end, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        speakerIds: values.speakers.map((speaker) => speaker.id),
        isACourse: values.type === 1,
        parentEventId: parent.id,
        registrationMode: mode,
      });
    } catch (error) {
      alert.showMessage(
        apiErrorMessage(
          error,
          "No se pudo guardar el sub-evento. Intenta de nuevo.",
        ),
      );
      return;
    }
    const registration =
      mode === "OWN" ? toSetupRequest(values.registration) : null;
    let configured = true;
    if (registration) {
      try {
        await putEventsByIdRegistration(id, registration);
      } catch {
        configured = false;
        alert.showMessage(
          "El sub-evento se guardó, pero no se pudo configurar la inscripción. Configúrela desde el sub-evento.",
        );
      }
    }
    if (configured) alert.showMessage("Guardado exitosamente");
    close();
    created();
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      slotProps={{ paper: { "aria-label": "Agregar sub-evento" } }}
      sx={{
        ".MuiDialog-paper": { borderRadius: "30px", scrollbarWidth: "none" },
      }}
    >
      <IconButton
        onClick={close}
        aria-label="Cerrar"
        sx={{ position: "absolute", right: 8, top: 8 }}
      >
        <CloseIcon />
      </IconButton>
      {open && (
        <EventForm
          nodeId={nodeId}
          initialValues={initialValues}
          submit={submit}
          editable
          showRegistration={showRegistration}
          container={{ title: parent.title ?? "", start, end }}
        />
      )}
    </Dialog>
  );
};
