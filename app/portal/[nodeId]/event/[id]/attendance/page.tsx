"use client";

import {
  deleteEventsById,
  useGetEventsById,
  useGetEventsByIdAttendanceSummary,
  useGetEventsByIdSharing,
} from "@/app/(api)/generated";
import { DialogDeleteConfirmation } from "@/app/(components)/DialogDeleteConfirmation";
import Loading from "@/app/(components)/Loading";
import { ResourceError } from "@/app/(components)/ResourceError";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { usePermissions } from "@/app/(hooks)/usePermissions";
import CloseIcon from "@mui/icons-material/Close";
import { Box, Chip, Dialog, IconButton, Stack, Tab, Tabs } from "@mui/material";
import { useRouter } from "next/navigation";
import React, { useContext } from "react";
import { AttendanceTab } from "./AttendanceTab";
import {
  DeleteRecurrentEventDialog,
  type DeleteEventRecurrentForm,
} from "./DeleteRecurrentEventDialog";
import { DetailTab } from "./DetailTab";
import { EditableEventForm } from "./EditableEventForm";
import { EventHero } from "./EventHero";
import { ShareEventButton } from "./ShareEventButton";
import { deleteMessage } from "./program";

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
    mutate: mutateEvent,
  } = useGetEventsById(id);
  // Only whoever manages the event knows who can open it.
  const { data: sharing } = useGetEventsByIdSharing(id, {
    swr: { enabled: can("events.write"), shouldRetryOnError: false },
  });
  const { data: summary } = useGetEventsByIdAttendanceSummary(id);

  const [tab, setTab] = React.useState<"detail" | "attendance">("detail");
  const [editing, setEditing] = React.useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [openConfirmDeleteDialog, setOpenConfirmDeleteDialog] =
    React.useState(false);
  // Which occurrences the confirmed deletion applies to.
  const [deleteOption, setDeleteOption] =
    React.useState<DeleteEventRecurrentForm["option"]>("THIS_EVENT");

  if (eventLoading) return <Loading />;
  if (!event) return <ResourceError error={eventError} />;

  const isRecurrent = Boolean(event.recurrence);

  const startDelete = () => {
    if (isRecurrent) {
      setOpenDeleteDialog(true);
      return;
    }
    setDeleteOption("THIS_EVENT");
    setOpenConfirmDeleteDialog(true);
  };

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

  return (
    <Stack spacing={3} sx={{ p: { xs: 2, md: 4 }, maxWidth: 1320 }}>
      <EventHero
        event={event}
        generalAccess={sharing?.generalAccess}
        canEdit={can("events.write")}
        canDelete={can("events.write")}
        onEdit={() => setEditing(true)}
        onDelete={startDelete}
        share={
          can("events.write") ? (
            <ShareEventButton
              asButton
              eventId={id}
              title={event.title ?? ""}
              subEvents={event.children?.length ?? 0}
            />
          ) : undefined
        }
      />
      <Tabs
        value={tab}
        onChange={(_, next) => setTab(next)}
        aria-label="Secciones del evento"
      >
        <Tab value="detail" label="Detalle" />
        <Tab
          value="attendance"
          label={
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
              }}
            >
              <span>Asistencia</span>
              {summary?.total ? (
                <Chip size="small" label={summary.total} />
              ) : null}
            </Stack>
          }
        />
      </Tabs>
      <Box role="tabpanel">
        {tab === "detail" ? (
          <DetailTab
            nodeId={nodeId}
            eventId={id}
            event={event}
            can={can}
            onChanged={() => void mutateEvent()}
          />
        ) : (
          <AttendanceTab
            nodeId={nodeId}
            eventId={id}
            event={event}
            canTake={can("attendance.write")}
          />
        )}
      </Box>
      {editing && (
        <Dialog
          open
          fullWidth
          maxWidth="md"
          onClose={() => setEditing(false)}
          slotProps={{ paper: { "aria-label": "Editar el evento" } }}
        >
          <IconButton
            aria-label="Cerrar"
            onClick={() => setEditing(false)}
            sx={{ position: "absolute", right: 8, top: 8, zIndex: 1 }}
          >
            <CloseIcon />
          </IconButton>
          <EditableEventForm
            nodeId={nodeId}
            eventId={id}
            event={event}
            editing
            saved={() => {
              setEditing(false);
              void mutateEvent();
            }}
          />
        </Dialog>
      )}
      {isRecurrent && (
        <DeleteRecurrentEventDialog
          open={openDeleteDialog}
          close={() => setOpenDeleteDialog(false)}
          initialValues={{ option: "THIS_EVENT" }}
          onDelete={chooseDeleteOption}
        />
      )}
      <DialogDeleteConfirmation
        open={openConfirmDeleteDialog}
        close={() => setOpenConfirmDeleteDialog(false)}
        onDelete={deleteEvent}
        message={deleteMessage(event.children?.length ?? 0)}
      />
    </Stack>
  );
}
