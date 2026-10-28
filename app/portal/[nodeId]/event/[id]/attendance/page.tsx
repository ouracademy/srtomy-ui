"use client";

import {
  deleteEventsById,
  putEventsByIdAttendance,
  useGetEventsById,
  useGetEventsByIdAttendance,
} from "@/app/(api)/generated";
import { EventDetailFormData, EventForm } from "@/app/(components)/EventForm";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { fromRecurrenceResponse } from "@/app/(components)/recurrence";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Stack, Tooltip, Typography, Grid } from "@mui/material";
import { GridRowId, GridRowSelectionModel } from "@mui/x-data-grid";
import React, { useContext } from "react";
import { PersonTable, fullName } from "../../../person/PersonTable";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import { useRouter } from "next/navigation";
import { RegisterButton } from "@/app/(components)/RegisterButton";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import { ShareEventButton } from "./ShareEventButton";
import { AttendanceTools } from "./AttendanceTools";
import { RegistrationPanel } from "./RegistrationPanel";
import { SaveButton } from "@/app/(components)/SaveButton";
import { noRegistration } from "@/app/(components)/registration";
import {
  DeleteRecurrentEventDialog,
  type DeleteEventRecurrentForm,
} from "./DeleteRecurrentEventDialog";

export default function AttendanceEvent(props: {
  params: Promise<{ id: string; nodeId: string }>;
}) {
  const params = React.use(props.params);
  const { id, nodeId } = params;

  const alert = useContext(SnackbarContext);
  const { can } = usePermissions(nodeId);
  const router = useRouter();

  const {
    data: event,
    error: eventError,
    isLoading: eventLoading,
  } = useGetEventsById(id);
  const {
    data: eventAttendance,
    isLoading,
    mutate: mutateAttendance,
  } = useGetEventsByIdAttendance(id);

  const [saving, setSaving] = React.useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] =
    React.useState(false);
  // Which occurrences the confirmed deletion applies to.
  const [deleteOption, setDeleteOption] =
    React.useState<DeleteEventRecurrentForm["option"]>("THIS_EVENT");

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

  // A visitor added while the list is being edited stays in it, so saving the
  // list does not take them out of the attendance.
  const addVisitorToSelection = (personId: string) => {
    setSelection((current) => {
      const ids = new Set((current ?? savedSelection).ids);
      ids.add(personId);
      return { type: "include", ids };
    });
    void mutateAttendance();
  };

  if (isLoading || eventLoading) return <Loading />;
  if (!event) return <ResourceError error={eventError} />;

  const isRecurrent = Boolean(event.recurrence);

  const chooseDeleteOption = (values: DeleteEventRecurrentForm) => {
    setDeleteOption(values.option);
    setOpenDeleteDialog(false);
    setOpenConfirmDeleteDialog(true);
  };

  const deleteEvent = async () => {
    try {
      await deleteEventsById(id, { option: deleteOption });
    } catch {
      setOpenConfirmDeleteDialog(false);
      alert.showMessage("No se pudo eliminar el evento. Intenta de nuevo.");
      return;
    }
    alert.showMessage("Eliminado");
    router.push(`/portal/${nodeId}/event`);
  };

  const initialValues: EventDetailFormData = {
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
    // Shown and changed in its own panel, not in this read-only form.
    registration: noRegistration(),
  };

  return (
    <Grid container spacing={2} margin={4}>
      <>
        <Grid size={{ xs: 12 }}>
          <Box>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              {can("events.write") && (
                <ShareEventButton eventId={id} title={event.title ?? ""} />
              )}
              <Tooltip title="Eliminar">
                <RegisterButton
                  icon={<DeleteIcon />}
                  ariaLabel="delete"
                  onClick={() => {
                    if (isRecurrent) {
                      setOpenDeleteDialog(true);
                      return;
                    }
                    setDeleteOption("THIS_EVENT");
                    setOpenConfirmDeleteDialog(true);
                  }}
                />
              </Tooltip>
            </div>
            <EventForm
              nodeId={nodeId}
              initialValues={initialValues}
              // Editing an event is not implemented yet.
              submit={() => undefined}
              editable={false}
            />
          </Box>
          {isRecurrent && (
            <DeleteRecurrentEventDialog
              open={openDeleteDialog}
              close={() => setOpenDeleteDialog(false)}
              initialValues={{
                option: "THIS_EVENT",
              }}
              onDelete={chooseDeleteOption}
            />
          )}
          <DialogDeleteConfirmation
            open={openConfirmDeleteDialog}
            close={() => setOpenConfirmDeleteDialog(false)}
            onDelete={deleteEvent}
          />
        </Grid>
        {can("registrations.read") && (
          <Grid size={{ xs: 12 }}>
            <RegistrationPanel
              eventId={id}
              title={event.title ?? ""}
              can={{
                configure: can("registrations.configure"),
                close: can("registrations.close"),
                remove: can("registrations.remove"),
                checkIn: can("attendance.write"),
              }}
            />
          </Grid>
        )}
        <Grid size={{ xs: 12 }} display="flex" alignItems="center">
          <Typography variant="h6" gutterBottom>
            Toma de asistencia
          </Typography>
        </Grid>
        {can("attendance.write") && (
          <Grid size={{ xs: 12 }}>
            <AttendanceTools
              eventId={id}
              title={event.title ?? ""}
              guestCount={eventAttendance?.guestCount ?? 0}
              onChanged={() => void mutateAttendance()}
              onVisitorAdded={addVisitorToSelection}
            />
          </Grid>
        )}
        <Grid size={{ xs: 12 }}>
          <Stack spacing={2}>
            <PersonTable
              nodeId={nodeId}
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
            loading={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await putEventsByIdAttendance(id, {
                  personIds: [...rowSelectionModel.ids].map(String),
                });
                alert.showMessage("Asistencia guardada exitosamente");
              } finally {
                setSaving(false);
              }
            }}
          />
        </Grid>
      </>
    </Grid>
  );
}
