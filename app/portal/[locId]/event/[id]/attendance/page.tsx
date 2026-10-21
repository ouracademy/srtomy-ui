"use client";

import {
  deleteEvent,
  saveAttendance,
  useEvent,
  useEventAttendance,
} from "@/app/(api)/services/events";
import { EventDetailFormData, EventForm } from "@/app/(components)/EventForm";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Stack, Tooltip, Typography, Grid } from "@mui/material";
import { GridRowId, GridRowSelectionModel } from "@mui/x-data-grid";
import React, { useContext } from "react";
import { PersonTable, fullName } from "../../../person/PersonTable";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { useRouter } from "next/navigation";
import { RegisterButton } from "@/app/(components)/RegisterButton";
import { SaveButton } from "@/app/(components)/SaveButton";
import {
  DeleteRecurrentEventDialog,
  type DeleteEventRecurrentForm,
} from "./DeleteRecurrentEventDialog";

export default function AttendanceEvent(props: {
  params: Promise<{ id: string; locId: string }>;
}) {
  const params = React.use(props.params);
  const { id, locId } = params;

  const alert = useContext(SnackbarContext);
  const router = useRouter();

  const {
    data: event,
    error: eventError,
    isLoading: eventLoading,
  } = useEvent(id);
  const { data: eventAttendance, isLoading } = useEventAttendance(id);

  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] =
    React.useState(false);

  // What the user picked, or null until they change the selection. Until
  // then the selection is the attendance already saved in the API.
  const [selection, setSelection] =
    React.useState<GridRowSelectionModel | null>(null);
  const savedSelection = React.useMemo<GridRowSelectionModel>(
    () => ({
      type: "include",
      ids: new Set<GridRowId>(eventAttendance?.personIds),
    }),
    [eventAttendance],
  );
  const rowSelectionModel = selection ?? savedSelection;

  if (isLoading || eventLoading) return <Loading />;
  if (!event) return <ResourceError error={eventError} />;

  const recurrentEvent = event.recurrentEvent || event;
  const isRecurrent = Boolean(event.recurrentEvent);

  const deleteEventRecur = async (values: DeleteEventRecurrentForm) => {
    await deleteEvent(id, values.option);
    setOpenDeleteDialog(false);
    alert.showMessage("Eliminado");
    router.push(`/portal/${locId}/event`);
  };

  const deleteSingleEvent = async () => {
    await deleteEvent(id, "THIS_EVENT");
    alert.showMessage("Eliminado");
    router.push(`/portal/${locId}/event`);
  };

  const initialValues: EventDetailFormData = {
    name: event.title,
    date: event.start,
    startTime: event.start,
    endTime: event.end,
    isRecurrent,
    daysOfWeek: isRecurrent ? recurrentEvent.daysOfWeek : [],
    endRecur: isRecurrent ? recurrentEvent.endRecur : undefined,
    type: event.isACourse ? 1 : 0,
    address: event.address,
    speakers: event.speakers.map((speaker) => ({
      id: speaker.id,
      label: fullName(speaker),
    })),
    description: event.description,
  };

  return (
    <Grid container spacing={2} margin={4}>
      <>
        <Grid size={{ xs: 12 }}>
          <Box>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Tooltip title="Eliminar">
                <RegisterButton
                  icon={<DeleteIcon />}
                  ariaLabel="delete"
                  onClick={() =>
                    isRecurrent
                      ? setOpenDeleteDialog(true)
                      : setOpenConfirmDeleteDialog(true)
                  }
                />
              </Tooltip>
            </div>
            <EventForm
              locId={locId}
              initialValues={initialValues}
              // Editing an event is not implemented yet.
              submit={() => undefined}
              editable={false}
            />
          </Box>
          {isRecurrent ? (
            <DeleteRecurrentEventDialog
              open={openDeleteDialog}
              close={() => setOpenDeleteDialog(false)}
              initialValues={{
                option: "THIS_EVENT",
              }}
              onDelete={deleteEventRecur}
            />
          ) : (
            <DialogDeleteConfirmation
              open={openConfirmDeleteDialog}
              close={() => setOpenConfirmDeleteDialog(false)}
              onDelete={deleteSingleEvent}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12 }} display="flex" alignItems="center">
          <Typography variant="h6" gutterBottom>
            Toma de asistencia
          </Typography>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Stack spacing={2}>
            <PersonTable
              locId={locId}
              dataGridProps={{
                keepNonExistentRowsSelected: true,
                checkboxSelection: true,
                rowSelectionModel: rowSelectionModel,
                onRowSelectionModelChange: (newSelectionModel) => {
                  setSelection(newSelectionModel);
                },
              }}
            />
          </Stack>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <SaveButton
            name="Registrar asistencias"
            onClick={async () => {
              await saveAttendance(id, [...rowSelectionModel.ids].map(String));
              alert.showMessage("Asistencia guardada exitosamente");
            }}
          />
        </Grid>
      </>
    </Grid>
  );
}
