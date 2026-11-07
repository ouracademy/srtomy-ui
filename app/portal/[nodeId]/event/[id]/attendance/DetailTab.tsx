"use client";

import { usePermissions } from "@/app/(hooks)/usePermissions";
import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { Grid, Paper, Stack, Typography } from "@mui/material";
import { ContainerNotice } from "./ContainerNotice";
import { InheritedRegistrationsPanel } from "./InheritedRegistrationsPanel";
import { NoticesPanel } from "./NoticesPanel";
import { ProgramSection } from "./ProgramSection";
import { RegistrationPanel } from "./RegistrationPanel";

type Can = ReturnType<typeof usePermissions>["can"];

type DetailTabProps = Readonly<{
  nodeId: string;
  eventId: string;
  event: EventResponse;
  can: Can;
  // The event changed (a session was added or moved): read it again.
  onChanged: () => void;
}>;

// What the event is: its program, how people sign up for it and what is said
// about it. The side column has the notices and the speakers.
export const DetailTab = ({
  nodeId,
  eventId,
  event,
  can,
  onChanged,
}: DetailTabProps) => {
  const isRecurrent = Boolean(event.recurrence);
  // A sub-event that inherits its registration or has none does not set one up.
  const hasOwnRegistration =
    !event.parentEventId || event.registrationMode === "OWN";
  // A sub-event entered with the sign-up of its mega event: its organizers see
  // who is expected there.
  const inheritsRegistration =
    Boolean(event.parentEventId) && event.registrationMode === "INHERIT";
  const speakers = event.speakers ?? [];

  return (
    <Grid container spacing={3} alignItems="flex-start">
      <Grid size={{ xs: 12, md: 8 }}>
        <Stack spacing={3}>
          {event.description && (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
              <Typography sx={{ whiteSpace: "pre-line" }}>
                {event.description}
              </Typography>
            </Paper>
          )}
          {event.parentEventId ? (
            <ContainerNotice nodeId={nodeId} event={event} />
          ) : (
            !isRecurrent && (
              <ProgramSection
                nodeId={nodeId}
                event={event}
                canAdd={can("events.write")}
                canConfigureRegistration={can("registrations.configure")}
                onChanged={onChanged}
              />
            )
          )}
          {can("registrations.read") && hasOwnRegistration && (
            <RegistrationPanel
              eventId={eventId}
              title={event.title ?? ""}
              subEvents={(event.children ?? []).map((child) => ({
                id: child.id ?? "",
                title: child.title ?? "",
              }))}
              can={{
                configure: can("registrations.configure"),
                close: can("registrations.close"),
                remove: can("registrations.remove"),
                checkIn: can("attendance.write"),
              }}
            />
          )}
          {can("registrations.read") && inheritsRegistration && (
            <InheritedRegistrationsPanel
              eventId={eventId}
              canCheckIn={can("attendance.write")}
            />
          )}
        </Stack>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Stack spacing={3}>
          <NoticesPanel eventId={eventId} canPost={can("events.write")} />
          {speakers.length > 0 && (
            <Paper
              variant="outlined"
              component="section"
              aria-label="Ponentes"
              sx={{ p: 2.5, borderRadius: 4 }}
            >
              <Stack spacing={1.5}>
                <Typography variant="h6" component="h2" fontWeight={700}>
                  Ponentes
                </Typography>
                {speakers.map((speaker) => (
                  <Typography key={speaker.id}>
                    {speaker.fullName ?? speaker.name}
                  </Typography>
                ))}
              </Stack>
            </Paper>
          )}
        </Stack>
      </Grid>
    </Grid>
  );
};
