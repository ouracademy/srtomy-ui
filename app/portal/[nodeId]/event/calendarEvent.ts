import type { EventInput } from "@fullcalendar/core";
import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { addDays, differenceInHours, startOfDay } from "date-fns";
import { originLabel, titleWithOrigin } from "../originLabel";

// A conference or a retreat: it is drawn as a band over the days it lasts. An
// overnight event (a vigil from 10 pm to 6 am) keeps its hours.
export const isMegaEvent = (event: Pick<EventResponse, "start" | "end">) =>
  event.start !== undefined &&
  event.end !== undefined &&
  differenceInHours(event.end, event.start) > 24;

export function toCalendarEvent(
  event: EventResponse,
  organizationId: string,
): EventInput {
  const mega = isMegaEvent(event);
  const classNames = ["cursor-pointer"];
  if (mega) classNames.push("fc-mega-event");
  if (event.parentEventId) classNames.push("fc-sub-event");

  return {
    ...event,
    // A sub-event says which event it belongs to, and any event says which
    // node it comes from when it is not the one being viewed.
    title: titleWithOrigin(
      titleWithOrigin(event.title ?? "", event.parentTitle ?? undefined),
      originLabel(
        event.organization?.id,
        event.organization?.name,
        organizationId,
      ),
    ),
    // The end of a band is the day after its last day.
    ...(mega && event.end
      ? { allDay: true, end: addDays(startOfDay(event.end), 1) }
      : {}),
    backgroundColor: event.isACourse ? "green" : undefined,
    classNames,
  };
}
