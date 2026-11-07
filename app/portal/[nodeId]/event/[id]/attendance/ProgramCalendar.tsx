"use client";

import type { ChildResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import FullCalendar from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/react/interaction";
import listPlugin from "@fullcalendar/react/list";
import esLocale from "@fullcalendar/react/locales/es";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";
import { Box, useMediaQuery, useTheme } from "@mui/material";
import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { visibleHours } from "./programHours";

type ProgramCalendarProps = Readonly<{
  // The days the program covers.
  start: Date;
  end: Date;
  items: ChildResponse[];
  // Whoever may move a sub-event (`events.write`) can drag it.
  canMove: boolean;
  // Resolves when saved; rejecting puts the sub-event back where it was.
  onMove: (id: string, start: Date, end: Date) => Promise<void>;
  // Dragging over free hours creates a session there.
  onCreate: (start: Date, end: Date) => void;
  // A session was clicked: its element, to show what can be done with it.
  onPick: (id: string, element: HTMLElement) => void;
}>;

const MAX_DAYS_SHOWN = 7;

// The program as a calendar of the days of the event, with its sub-events.
// Dragging one changes its day and hour, which is how the program is ordered.
export const ProgramCalendar = ({
  start,
  end,
  items,
  canMove,
  onMove,
  onCreate,
  onPick,
}: ProgramCalendarProps) => {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));
  const days = Math.max(1, differenceInCalendarDays(end, start) + 1);
  const hours = visibleHours([
    ...items,
    { start, end: days === 1 ? end : start },
  ]);

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
        plugins={[
          classicThemePlugin,
          interactionPlugin,
          timeGridPlugin,
          listPlugin,
        ]}
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
        slotMinTime={hours.slotMinTime}
        slotMaxTime={hours.slotMaxTime}
        selectable={canMove}
        selectMirror
        select={({ start: from, end: to }) => onCreate(from, to)}
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
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          onPick(info.event.id, info.el);
        }}
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
