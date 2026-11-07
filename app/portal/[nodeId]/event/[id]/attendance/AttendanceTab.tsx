"use client";

import {
  putEventsByIdAttendance,
  useGetEventsByIdAttendance,
} from "@/app/(api)/generated";
import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import Loading from "@/app/(components)/Loading";
import { SaveButton } from "@/app/(components)/SaveButton";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { Paper, Stack, Typography } from "@mui/material";
import { GridRowId, GridRowSelectionModel } from "@mui/x-data-grid";
import { useContext, useMemo, useState } from "react";
import { PersonTable } from "../../../person/PersonTable";
import { AttendanceTools } from "./AttendanceTools";
import { AttendanceTotal } from "./AttendanceTotal";

type AttendanceTabProps = Readonly<{
  nodeId: string;
  eventId: string;
  event: EventResponse;
  // Whoever takes attendance (`attendance.write`).
  canTake: boolean;
}>;

// Everything about who came to the event, apart from its details: how many
// came, the QR and the ticket scanner, the visitors and the list of people.
export const AttendanceTab = ({
  nodeId,
  eventId,
  event,
  canTake,
}: AttendanceTabProps) => {
  const alert = useContext(SnackbarContext);
  const {
    data: attendance,
    isLoading,
    mutate,
  } = useGetEventsByIdAttendance(eventId);
  const [saving, setSaving] = useState(false);

  // What the user picked, or null until they change the selection. Until
  // then the selection is the attendance already saved in the API.
  const [selection, setSelection] = useState<GridRowSelectionModel | null>(
    null,
  );
  const savedSelection = useMemo<GridRowSelectionModel>(
    () => ({
      type: "include",
      ids: new Set<GridRowId>(attendance?.personIds),
    }),
    [attendance],
  );
  const rowSelectionModel = selection ?? savedSelection;

  // A visitor added while the list is being edited stays in it, so saving the
  // list does not take them out of the attendance.
  const addVisitorToSelection = (personId: string) => {
    setSelection((current) => {
      const ids = new Set((current ?? savedSelection).ids);
      ids.add(personId);
      return { type: "include", ids };
    });
    void mutate();
  };

  if (isLoading) return <Loading />;

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
        <AttendanceTotal eventId={eventId} />
      </Paper>
      {canTake && (
        <AttendanceTools
          eventId={eventId}
          title={event.title ?? ""}
          guestCount={attendance?.guestCount ?? 0}
          onChanged={() => void mutate()}
          onVisitorAdded={addVisitorToSelection}
        />
      )}
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
        <Stack spacing={2}>
          <Typography variant="h6" component="h2" fontWeight={700}>
            Lista de asistencia
          </Typography>
          <PersonTable
            nodeId={nodeId}
            dataGridProps={{
              keepNonExistentRowsSelected: true,
              checkboxSelection: true,
              rowSelectionModel,
              onRowSelectionModelChange: (next) => setSelection(next),
            }}
          />
          <div>
            <SaveButton
              name="Registrar asistencias"
              loading={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await putEventsByIdAttendance(eventId, {
                    personIds: [...rowSelectionModel.ids].map(String),
                  });
                  alert.showMessage("Asistencia guardada exitosamente");
                } finally {
                  setSaving(false);
                }
              }}
            />
          </div>
        </Stack>
      </Paper>
    </Stack>
  );
};
