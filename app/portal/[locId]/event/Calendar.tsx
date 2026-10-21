import interactionPlugin from "@fullcalendar/interaction"; // for selectable
import AddIcon from "@mui/icons-material/Add";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import esLocale from "@fullcalendar/core/locales/es";
import { addHours, differenceInDays } from "date-fns";
import { fetchEvents } from "@/app/(api)/services/events";
import { useRouter } from "next/navigation";
import { Box, Fab, useMediaQuery, useTheme } from "@mui/material";
import listPlugin from "@fullcalendar/list";

export type DatesSelection = {
  start: Date;
  end: Date;
  jsEvent: MouseEvent | null;
};

export default function Calendar({
  organizationId,
  onSelect,
}: {
  organizationId: number;
  onSelect: (arg: DatesSelection) => void;
}) {
  const router = useRouter();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));
  const startDate = addHours(new Date(), 1);
  const endDate = addHours(new Date(), 2);

  return (
    <>
      <Box
        sx={{
          "& .fc-header-toolbar > .fc-toolbar-chunk:nth-child(3)": {
            display: "flex",
          },
        }}
      >
        <FullCalendar
          locale={esLocale}
          plugins={[interactionPlugin, timeGridPlugin, listPlugin]}
          initialView={isDesktop ? "timeGridWeek" : "listWeek"}
          height={isDesktop ? undefined : "60vh"}
          nowIndicator
          allDaySlot={false}
          selectable
          selectMirror
          selectAllow={({ start, end }) => {
            // for allowing to select only dates in same day
            return differenceInDays(end, start) <= 0;
          }}
          select={({ start, end, jsEvent }) => {
            onSelect({ start, end, jsEvent });
          }}
          // unselect
          // dateClick
          eventClick={(info) => {
            const event = info.event;
            router.push(`event/${event.id}/attendance`);
          }}
          events={(info, successCallback, failureCallback) => {
            return fetchEvents({
              organizationId,
              start: info.start,
              end: info.end,
            })
              .then((events) =>
                successCallback(
                  events.map((event) => {
                    if (event.isACourse) {
                      event.backgroundColor = "green";
                    }
                    event.classNames = ["cursor-pointer"];
                    return event;
                  }),
                ),
              )
              .catch((err) => failureCallback(err));
          }}
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
