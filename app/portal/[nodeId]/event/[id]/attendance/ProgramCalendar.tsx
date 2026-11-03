"use client";

import type { ChildResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import esLocale from "@fullcalendar/core/locales/es";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";

type ProgramCalendarProps = Readonly<{
  nodeId: string;
  // The days the program covers.
  start: Date;
  end: Date;
  items: ChildResponse[];
  // Whoever may move a sub-event (`events.write`) can drag it.
  canMove: boolean;
  // Resolves when saved; rejecting puts the sub-event back where it was.
  onMove: (id: string, start: Date, end: Date) => Promise<void>;
}>;

const MAX_DAYS_SHOWN = 7;

// The program as a calendar of the days of the event, with its sub-events.
// Dragging one changes its day and hour, which is how the program is ordered.
export const ProgramCalendar = ({
  nodeId,
  start,
  end,
  items,
  canMove,
  onMove,
}: ProgramCalendarProps) => {
  const router = useRouter();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));
  const days = Math.max(1, differenceInCalendarDays(end, start) + 1);

  return (
    <Box
      sx={{
        "& .fc-sub-event": { borderStyle: "dashed" },
        "& .fc-course": {
          "--fc-event-bg-color": theme.palette.success.dark,
          "--fc-event-border-color": theme.palette.success.dark,
        },
      }}
    >
      <FullCalendar
        locale={esLocale}
        plugins={[interactionPlugin, timeGridPlugin, listPlugin]}
        initialView="program"
        views={{
          program: {
            type: isDesktop ? "timeGrid" : "list",
            duration: { days: Math.min(days, MAX_DAYS_SHOWN) },
          },
        }}
        initialDate={start}
        validRange={{
          start: startOfDay(start),
          end: addDays(startOfDay(end), 1),
        }}
        headerToolbar={days > MAX_DAYS_SHOWN ? { left: "prev,next" } : false}
        allDaySlot={false}
        height="auto"
        editable={canMove}
        eventDurationEditable={canMove}
        events={items.map((item) => ({
          id: item.id,
          title: item.title,
          start: item.start,
          end: item.end,
          classNames: [
            "fc-sub-event",
            ...(item.isACourse ? ["fc-course"] : []),
          ],
        }))}
        eventClick={(info) =>
          router.push(`/portal/${nodeId}/event/${info.event.id}/attendance`)
        }
        eventDrop={(info) => moveOrRevert(info, onMove)}
        eventResize={(info) => moveOrRevert(info, onMove)}
      />
    </Box>
  );
};

type Change = Readonly<{
  event: { id: string; start: Date | null; end: Date | null };
  revert: () => void;
}>;

const moveOrRevert = async (
  { event, revert }: Change,
  onMove: ProgramCalendarProps["onMove"],
) => {
  if (!event.start || !event.end) return revert();
  try {
    await onMove(event.id, event.start, event.end);
  } catch {
    revert();
  }
};
