"use client";

import { postEvents, putEventsByIdRegistration } from "@/app/(api)/generated";
import { EventForm } from "@/app/(components)/EventForm";
import { eventRange, lastsSeveralDays } from "@/app/(components)/eventRange";
import {
  noRecurrence,
  toRecurrenceRequest,
} from "@/app/(components)/recurrence";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import {
  noRegistration,
  toSetupRequest,
} from "@/app/(components)/registration";
import CloseIcon from "@mui/icons-material/Close";
import { Dialog, IconButton, Stack, Typography } from "@mui/material";
import React, { useContext, useState } from "react";
import dynamic from "next/dynamic";
import Loading from "@/app/(components)/Loading";
import type { DatesSelection } from "./Calendar";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { initialRange } from "./selectionDefaults";

// FullCalendar and its plugins are heavy and only this page uses them.
const Calendar = dynamic(() => import("./Calendar"), {
  ssr: false,
  loading: () => <Loading />,
});

export default function EventListPage(props: {
  params: Promise<{ nodeId: string }>;
}) {
  const params = React.use(props.params);
  const { nodeId } = params;
  const alert = useContext(SnackbarContext);
  const { can } = usePermissions(nodeId);
  const router = useRouter();

  const [spanSelected, setSpanSelected] = useState<DatesSelection>();
  // Changes after creating an event, so the calendar shows it.
  const [eventsVersion, setEventsVersion] = useState(0);

  const close = () => setSpanSelected(undefined);
  // Stable, so the calendar does not render again when the dialog opens.
  const selectDates = React.useCallback(
    (selection: DatesSelection) => setSpanSelected(selection),
    [],
  );

  return (
    <Stack direction="column" spacing={2} p={4}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="h4">Eventos y cursos</Typography>
      </Stack>
      <Calendar
        organizationId={nodeId}
        onSelect={selectDates}
        refreshKey={eventsVersion}
      />
      <Dialog
        open={Boolean(spanSelected)}
        sx={{
          ".MuiDialog-paper": { borderRadius: "30px", scrollbarWidth: "none" },
        }}
      >
        <IconButton
          onClick={close}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
        {spanSelected && (
          <EventForm
            nodeId={nodeId}
            initialValues={{
              name: "",
              ...initialRange(spanSelected),
              address: "",
              description: "",
              recurrence: noRecurrence(),
              type: 0,
              speakers: [],
              registration: noRegistration(),
            }}
            showRegistration={can("registrations.configure")}
            submit={async (values) => {
              const { start, end } = eventRange(values);
              const data = {
                name: values.name,
                address: values.address,
                organizationId: nodeId,
                startTime: format(start, "yyyy-MM-dd'T'HH:mm:ssXXX"),
                endTime: format(end, "yyyy-MM-dd'T'HH:mm:ssXXX"),
                recurrence: toRecurrenceRequest(values.recurrence, values.date),
                // The series keeps its local hour across summer time.
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                speakerIds: values.speakers.map((x) => x.id),
                description: values.description,
                isACourse: values.type === 1,
              };

              const eventId = await postEvents(data);
              close();
              setEventsVersion((version) => version + 1);
              const registration = toSetupRequest(values.registration);
              let configured = true;
              if (registration && values.recurrence.frequency === "NONE") {
                try {
                  await putEventsByIdRegistration(eventId, registration);
                } catch {
                  configured = false;
                  alert.showMessage(
                    "El evento se guardó, pero no se pudo configurar la inscripción. Configúrela desde el evento.",
                  );
                }
              }
              if (configured) alert.showMessage("Guardado exitosamente");
              // An event that lasts days is built up from its own screen, where
              // its program (sub-events and courses) can be added if wanted.
              if (lastsSeveralDays(values)) {
                router.push(`/portal/${nodeId}/event/${eventId}/attendance`);
              }
            }}
            editable={true}
          />
        )}
      </Dialog>
    </Stack>
  );
}
