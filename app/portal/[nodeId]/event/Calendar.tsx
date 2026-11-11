import AddIcon from "@mui/icons-material/Add";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FullCalendar, { type EventSourceFunc } from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/react/interaction"; // for selectable
import listPlugin from "@fullcalendar/react/list";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import esLocale from "@fullcalendar/react/locales/es";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";
import { addHours } from "date-fns";
import { getEvents } from "@/app/(api)/generated";
import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Fab,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
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
  const calendarRef =
    React.useRef<React.ComponentRef<typeof FullCalendar>>(null);
  const [loading, setLoading] = React.useState(false);
  const [title, setTitle] = React.useState("");
  // FullCalendar 7 loads the events while it renders; waiting for the page to
  // mount keeps React from warning about state updated before mounting.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const id = setTimeout(() => setMounted(true));
    return () => clearTimeout(id);
  }, []);
  const shownKey = React.useRef(refreshKey);
  React.useEffect(() => {
    if (shownKey.current === refreshKey) return;
    shownKey.current = refreshKey;
    calendarRef.current?.getApi().refetchEvents();
  }, [refreshKey]);
  const startDate = addHours(new Date(), 1);
  const endDate = addHours(new Date(), 2);
  const addNow = () =>
    onSelect({ start: startDate, end: endDate, jsEvent: null });
  // FullCalendar calls these while it renders, and React forbids setting the
  // state of this component then, so they are deferred.
  const showLoading = React.useCallback(
    (value: boolean) => setTimeout(() => setLoading(value)),
    [],
  );
  const showTitle = React.useCallback(
    (info: { view: { title: string } }) =>
      setTimeout(() => setTitle(info.view.title)),
    [],
  );
  // The days are shown from today on, with the current hour in view.
  const scrollTime = `${String(Math.max(new Date().getHours() - 1, 0)).padStart(2, "0")}:00:00`;

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
          // An event that lasts several days, and a sub-event of one.
          "& .fc-mega-event": {
            "--fc-event-bg-color": theme.palette.secondary.main,
            "--fc-event-border-color": theme.palette.secondary.main,
          },
          "& .fc-sub-event": { borderStyle: "dashed" },
          // An event that has a program of sessions.
          "& .fc-has-program": { borderBottomWidth: 4 },
          "& .fc-classic-zIi": { cursor: "pointer" },
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "center", flexWrap: "wrap", mb: 1 }}
        >
          <IconButton
            aria-label="Anterior"
            onClick={() => calendarRef.current?.getApi().prev()}
          >
            <ChevronLeftIcon />
          </IconButton>
          <IconButton
            aria-label="Siguiente"
            onClick={() => calendarRef.current?.getApi().next()}
          >
            <ChevronRightIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="h2"
            aria-live="polite"
            sx={{ flexGrow: 1 }}
          >
            {title}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => calendarRef.current?.getApi().today()}
          >
            Hoy
          </Button>
          {isDesktop && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={addNow}
            >
              Crear
            </Button>
          )}
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {isDesktop
            ? "Haz clic en un horario o arrastra sobre el calendario para crear un evento o curso."
            : "Toca el botón + para crear un evento o curso."}
        </Typography>
        {/* Reserves its height, so the calendar does not jump when it shows. */}
        <Box sx={{ height: 4 }}>
          {loading && <LinearProgress aria-label="Cargando eventos" />}
        </Box>
        {mounted && (
          <FullCalendar
            ref={calendarRef}
            loading={showLoading}
            datesSet={showTitle}
            headerToolbar={false}
            locale={esLocale}
            plugins={[
              classicThemePlugin,
              interactionPlugin,
              timeGridPlugin,
              listPlugin,
            ]}
            views={{
              days: { type: "timeGrid", duration: { days: 7 } },
              list: { type: "list", duration: { days: 7 } },
            }}
            initialView={isDesktop ? "days" : "list"}
            scrollTime={scrollTime}
            scrollTimeReset={false}
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
        )}
        {!isDesktop && (
          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Fab color="primary" aria-labelledby="Dialog" onClick={addNow}>
              <AddIcon />
            </Fab>
          </Box>
        )}
      </Box>
    </>
  );
}

export default React.memo(Calendar);
