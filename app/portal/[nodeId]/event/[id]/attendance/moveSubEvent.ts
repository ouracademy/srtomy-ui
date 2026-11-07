import { format } from "date-fns";
import type {
  EditEventRequest,
  EventResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { getEventsById, putEventsById } from "@/app/(api)/generated";

const stamp = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm:ssXXX");

// The body of PUT /events/{id} that only moves a sub-event: everything else
// stays as it is. A sub-event never repeats, so no rule is sent.
export const toMoveRequest = (
  event: EventResponse,
  start: Date,
  end: Date,
  timeZone: string,
): EditEventRequest => ({
  name: event.title ?? "",
  address: event.address,
  description: event.description,
  organizationId: event.organization?.id ?? "",
  isACourse: event.isACourse,
  speakerIds: (event.speakers ?? []).map((speaker) => speaker.id ?? ""),
  startTime: stamp(start),
  endTime: stamp(end),
  option: "THIS_EVENT",
  registrationMode: event.registrationMode,
  timeZone,
});

// Moves a sub-event in time (dragging it in the program). The API checks that
// it stays inside its parent and emails whoever signed up.
export const moveSubEvent = async (id: string, start: Date, end: Date) => {
  const event = await getEventsById(id);
  return putEventsById(
    id,
    toMoveRequest(
      event,
      start,
      end,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    ),
  );
};
