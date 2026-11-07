"use client";

import type { ChildResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { describeRegistrationMode } from "@/app/(components)/registrationMode";
import { Button, Chip, Popover, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { dateRangeLabel, hoursLabel } from "./eventSummary";

type SessionPopoverProps = Readonly<{
  nodeId: string;
  session: ChildResponse | null;
  // The element of the session in the calendar, which the card hangs from.
  anchor: HTMLElement | null;
  close: () => void;
  // Whoever may edit and delete sessions (`events.write`).
  canEdit: boolean;
  onRemove: (session: ChildResponse) => void;
}>;

// What can be done with a session of the program once it is clicked in the
// calendar: see what it is, open it to edit it, or delete it.
export const SessionPopover = ({
  nodeId,
  session,
  anchor,
  close,
  canEdit,
  onRemove,
}: SessionPopoverProps) => (
  <Popover
    open={Boolean(session && anchor)}
    anchorEl={anchor}
    onClose={close}
    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    slotProps={{ paper: { "aria-label": session?.title } }}
  >
    {session && (
      <Stack spacing={1.5} sx={{ p: 2, maxWidth: 300 }}>
        <Typography variant="subtitle1" component="h3" fontWeight={700}>
          {session.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {dateRangeLabel(session.start, session.end)},{" "}
          {hoursLabel(session.start, session.end)}
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip
            size="small"
            variant="outlined"
            label={session.isACourse ? "Curso" : "Evento"}
          />
          <Chip
            size="small"
            variant="outlined"
            label={describeRegistrationMode(session.registrationMode)?.summary}
          />
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Button
            variant="contained"
            size="small"
            component={NextLink}
            href={`/portal/${nodeId}/event/${session.id}/attendance`}
          >
            {canEdit ? "Abrir y editar" : "Abrir"}
          </Button>
          {canEdit && (
            <Button
              size="small"
              color="error"
              variant="outlined"
              onClick={() => {
                close();
                onRemove(session);
              }}
            >
              Eliminar
            </Button>
          )}
        </Stack>
      </Stack>
    )}
  </Popover>
);
