"use client";

import { createEvent } from "@/app/(api)/services/events";
import { EventForm } from "@/app/(components)/EventForm";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
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
  params: Promise<{ locId: string }>;
}) {
  const params = React.use(props.params);
  const { locId } = params;
  const alert = useContext(SnackbarContext);

  const [spanSelected, setSpanSelected] = useState<DatesSelection>();

  const close = () => setSpanSelected(undefined);

  return (
    <Stack direction="column" spacing={2} p={4}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography variant="h4">Eventos y cursos</Typography>
      </Stack>
      <Calendar
        organizationId={locId}
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
            locId={locId}
            initialValues={{
              name: "",
              date: spanSelected.start,
              startTime: spanSelected.start,
              endTime: spanSelected.end,
              address: "",
              description: "",
              isRecurrent: false,
              daysOfWeek: [],
              type: 0,
              speakers: [],
            }}
            submit={async (values) => {
              if (values.isRecurrent && !values.endRecur) {
                return;
              }
              const data = {
                name: values.name,
                address: values.address,
                organizationId: locId,
                startTime: format(values.startTime, "yyyy-MM-dd'T'HH:mm:ssXXX"),
                endTime: format(values.endTime, "yyyy-MM-dd'T'HH:mm:ssXXX"),
                endRecur: values.endRecur,
                speakerIds: values.speakers.map((x) => x.id),
                description: values.description,
                daysOfWeek: values.daysOfWeek,
                isACourse: values.type === 1,
              };

              await createEvent(data);
              close();
              alert.showMessage("Guardado exitosamente");
            }}
            editable={true}
          />
        )}
      </Dialog>
    </Stack>
  );
}
