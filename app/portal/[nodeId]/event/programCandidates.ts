import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { isMegaEvent } from "./calendarEvent";

// The events whose program the hours picked on the calendar fall inside: an
// event that has sub-events, or lasts several days, and is not itself a
// sub-event. Choosing one adds the new session to its program.
export const programCandidates = (
  events: EventResponse[],
  picked: { start: Date; end: Date },
): EventResponse[] =>
  events.filter(
    (event) =>
      !event.parentEventId &&
      !event.recurrence &&
      event.start !== undefined &&
      event.end !== undefined &&
      event.start <= picked.start &&
      event.end >= picked.end &&
      ((event.programSize ?? 0) > 0 || isMegaEvent(event)),
  );
