import interactionPlugin from "@fullcalendar/interaction"; // for selectable
import AddIcon from "@mui/icons-material/Add";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import esLocale from "@fullcalendar/core/locales/es";
import { addHours } from "date-fns";
import { getEvents } from "@/app/(api)/generated";
import type { EventSourceFunc } from "@fullcalendar/core";
import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Fab,
  LinearProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import listPlugin from "@fullcalendar/list";
import { toCalendarEvent } from "./calendarEvent";

export type DatesSelection = {
  start: Date;
  end: Date;
  // Picked in the row of events that last several days.
  allDay?: boolean;
  jsEvent: MouseEvent | null;
};

function Calendar({
  organizationId,
  onSelect,
  refreshKey = 0,
}: {
  organizationId: string;
  onSelect: (arg: DatesSelection) => void;
  // Changes when an event was added or changed elsewhere, so the list is asked
  // for again (the calendar does not do it on its own).
  refreshKey?: number;
}) {
  const router = useRouter();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));
  const calendarRef = React.useRef<FullCalendar>(null);
  const [loading, setLoading] = React.useState(false);
  const shownKey = React.useRef(refreshKey);
  React.useEffect(() => {
    if (shownKey.current === refreshKey) return;
    shownKey.current = refreshKey;
    calendarRef.current?.getApi().refetchEvents();
  }, [refreshKey]);
  const startDate = addHours(new Date(), 1);
  const endDate = addHours(new Date(), 2);

  // FullCalendar asks for the events again when this function changes, so it
  // must stay the same across renders: opening the dialog to add an event
  // renders the page again and must not reload the list.
  const fetchEvents = React.useCallback<EventSourceFunc>(
    (info, successCallback, failureCallback) =>
      getEvents({
        organizationId,
        start: info.start,
        end: info.end,
      })
        .then((events) =>
          successCallback(
            events.map((event) => toCalendarEvent(event, organizationId)),
          ),
        )
        .catch((err) => failureCallback(err)),
    [organizationId],
  );

  return (
    <>
      <Box
        sx={{
          "& .fc-header-toolbar > .fc-toolbar-chunk:nth-child(3)": {
            display: "flex",
          },
          // An event that lasts several days, and a sub-event of one.
          "& .fc-mega-event": {
            "--fc-event-bg-color": theme.palette.secondary.main,
            "--fc-event-border-color": theme.palette.secondary.main,
          },
          "& .fc-sub-event": { borderStyle: "dashed" },
        }}
      >
        {/* Reserves its height, so the calendar does not jump when it shows. */}
        <Box sx={{ height: 4 }}>
          {loading && <LinearProgress aria-label="Cargando eventos" />}
        </Box>
        <FullCalendar
          ref={calendarRef}
          loading={setLoading}
          locale={esLocale}
          plugins={[interactionPlugin, timeGridPlugin, listPlugin]}
          initialView={isDesktop ? "timeGridWeek" : "listWeek"}
          height={isDesktop ? undefined : "60vh"}
          nowIndicator
          allDaySlot
          allDayText="Varios días"
          selectable
          selectMirror
          select={({ start, end, allDay, jsEvent }) => {
            onSelect({ start, end, allDay, jsEvent });
          }}
          // unselect
          // dateClick
          eventClick={(info) => {
            const event = info.event;
            router.push(`event/${event.id}/attendance`);
          }}
          events={fetchEvents}
        />
        {!isDesktop && (
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Fab
              color="primary"
              aria-labelledby="Dialog"
              onClick={() =>
                onSelect({ start: startDate, end: endDate, jsEvent: null })
              }
            >
              <AddIcon />
            </Fab>
          </Box>
        )}
      </Box>
    </>
  );
}

export default React.memo(Calendar);
