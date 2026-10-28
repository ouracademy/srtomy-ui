"use client";

import { postEvents, putEventsByIdRegistration } from "@/app/(api)/generated";
import { EventForm } from "@/app/(components)/EventForm";
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

  const [spanSelected, setSpanSelected] = useState<DatesSelection>();

  const close = () => setSpanSelected(undefined);

  return (
    <Stack direction="column" spacing={2} p={4}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="h4">Eventos y cursos</Typography>
      </Stack>
      <Calendar
        organizationId={nodeId}
        onSelect={(x) => {
          setSpanSelected(x);
        }}
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
              date: spanSelected.start,
              startTime: spanSelected.start,
              endTime: spanSelected.end,
              address: "",
              description: "",
              recurrence: noRecurrence(),
              type: 0,
              speakers: [],
              registration: noRegistration(),
            }}
            showRegistration={can("registrations.configure")}
            submit={async (values) => {
              const data = {
                name: values.name,
                address: values.address,
                organizationId: nodeId,
                startTime: format(values.startTime, "yyyy-MM-dd'T'HH:mm:ssXXX"),
                endTime: format(values.endTime, "yyyy-MM-dd'T'HH:mm:ssXXX"),
                recurrence: toRecurrenceRequest(values.recurrence, values.date),
                // The series keeps its local hour across summer time.
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                speakerIds: values.speakers.map((x) => x.id),
                description: values.description,
                isACourse: values.type === 1,
              };

              const eventId = await postEvents(data);
              close();
              const registration = toSetupRequest(values.registration);
              if (registration && values.recurrence.frequency === "NONE") {
                try {
                  await putEventsByIdRegistration(eventId, registration);
                } catch {
                  alert.showMessage(
                    "El evento se guardó, pero no se pudo configurar la inscripción. Configúrela desde el evento.",
                  );
                  return;
                }
              }
              alert.showMessage("Guardado exitosamente");
            }}
            editable={true}
          />
        )}
      </Dialog>
    </Stack>
  );
}
