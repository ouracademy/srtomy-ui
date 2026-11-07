"use client";

import {
  putEventsByIdAttendance,
  useGetEventsByIdAttendance,
  useGetEventsByIdRegistrations,
} from "@/app/(api)/generated";
import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import Loading from "@/app/(components)/Loading";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { apiErrorMessage } from "@/app/(components)/apiErrorMessage";
import { MenuItem, Stack, TextField } from "@mui/material";
import { useContext, useId, useState } from "react";
import { AttendanceList } from "./AttendanceList";
import { AttendanceTools } from "./AttendanceTools";
import { AttendanceTotal } from "./AttendanceTotal";

type AttendanceTabProps = Readonly<{
  nodeId: string;
  eventId: string;
  event: EventResponse;
  // Whoever takes attendance (`attendance.write`).
  canTake: boolean;
}>;

const WHOLE_EVENT = "all";

const sessionLabel = (start?: Date) =>
  start
    ? new Date(start).toLocaleString("es-PE", {
        weekday: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

// Everything about who came to the event, apart from its details: how many
// came, the QR and the ticket scanner, the visitors and the list of people.
// When the event has a program, it is taken for the whole event or for one of
// its sessions.
export const AttendanceTab = ({
  nodeId,
  eventId,
  event,
  canTake,
}: AttendanceTabProps) => {
  const sessions = event.children ?? [];
  const [session, setSession] = useState(WHOLE_EVENT);
  const selectId = useId();
  const current = sessions.find((item) => item.id === session);
  const targetId = current?.id ?? eventId;
  const targetTitle = current?.title ?? event.title ?? "";

  return (
    <Stack spacing={3}>
      {sessions.length > 0 && (
        <TextField
          select
          id={selectId}
          label="Asistencia de"
          value={current ? session : WHOLE_EVENT}
          onChange={(change) => setSession(change.target.value)}
          size="small"
          sx={{ minWidth: 280, alignSelf: "flex-start" }}
        >
          <MenuItem value={WHOLE_EVENT}>Todo el evento</MenuItem>
          {sessions.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {sessionLabel(item.start)} · {item.title}
            </MenuItem>
          ))}
        </TextField>
      )}
      <SessionAttendance
        key={targetId}
        nodeId={nodeId}
        eventId={targetId}
        title={targetTitle}
        canTake={canTake}
      />
    </Stack>
  );
};

type SessionAttendanceProps = Readonly<{
  nodeId: string;
  eventId: string;
  title: string;
  canTake: boolean;
}>;

// The attendance of one event or session.
const SessionAttendance = ({
  nodeId,
  eventId,
  title,
  canTake,
}: SessionAttendanceProps) => {
  const alert = useContext(SnackbarContext);
  const {
    data: attendance,
    isLoading,
    mutate,
  } = useGetEventsByIdAttendance(eventId);
  // Who signed up to come, to say how many were expected. An event without
  // sign-up has no one expected.
  const { data: registrations } = useGetEventsByIdRegistrations(eventId);
  const expected = (registrations ?? []).filter(
    (item) => item.status !== "CANCELLED",
  ).length;

  const save = async (personIds: string[]) => {
    try {
      await putEventsByIdAttendance(eventId, { personIds });
      await mutate();
    } catch (failure) {
      alert.showMessage(
        apiErrorMessage(failure, "No se pudo guardar la asistencia"),
      );
    }
  };

  if (isLoading) return <Loading />;

  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      alignItems="flex-start"
      useFlexGap
      sx={{ gap: 3 }}
    >
      <Stack spacing={3} sx={{ flex: "999 1 640px", minWidth: 0 }}>
        <AttendanceTotal eventId={eventId} expected={expected || undefined} />
        <AttendanceList
          nodeId={nodeId}
          marks={attendance?.marks ?? []}
          canTake={canTake}
          onSave={save}
        />
      </Stack>
      {canTake && (
        <Stack sx={{ flex: "1 1 320px", minWidth: 0 }}>
          <AttendanceTools
            eventId={eventId}
            title={title}
            guestCount={attendance?.guestCount ?? 0}
            onChanged={() => void mutate()}
          />
        </Stack>
      )}
    </Stack>
  );
};
