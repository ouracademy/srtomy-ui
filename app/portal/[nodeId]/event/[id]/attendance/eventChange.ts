import { format } from "date-fns";
import type {
  EditEventRequest,
  RecurrenceRequest,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import type { EventDetailFormData } from "@/app/(components)/EventForm";
import { eventRange } from "@/app/(components)/eventRange";
import { toRecurrenceRequest } from "@/app/(components)/recurrence";

export type EditOption = NonNullable<EditEventRequest["option"]>;

// What the user changed in an event, as far as it matters to the people who
// signed up and to the rest of its series.
export type EventChange = {
  // The date, the start or the end moved: whoever signed up gets an email.
  scheduleMoved: boolean;
  // The name, the place or the speakers changed: they get an email too.
  detailsChanged: boolean;
  // The date of the event moved to another day.
  dayMoved: boolean;
  // The way the event repeats changed.
  ruleChanged: boolean;
};

const sameInstant = (a: Date, b: Date) => a.getTime() === b.getTime();
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// The event may end on another day than it starts (a conference).
export const startOf = (values: EventDetailFormData) =>
  eventRange(values).start;
export const endOf = (values: EventDetailFormData) => eventRange(values).end;

const byNumber = (a: number, b: number) => a - b;

const sameRecurrence = (
  a: EventDetailFormData["recurrence"],
  b: EventDetailFormData["recurrence"],
) =>
  a.frequency === b.frequency &&
  a.interval === b.interval &&
  a.monthlyMode === b.monthlyMode &&
  a.endType === b.endType &&
  a.count === b.count &&
  [...a.daysOfWeek].sort(byNumber).join() ===
    [...b.daysOfWeek].sort(byNumber).join() &&
  (a.until?.getTime() ?? null) === (b.until?.getTime() ?? null);

const speakerIds = (values: EventDetailFormData) =>
  values.speakers
    .map((speaker) => speaker.id)
    .sort((a, b) => a.localeCompare(b))
    .join();

export const describeChange = (
  initial: EventDetailFormData,
  values: EventDetailFormData,
): EventChange => ({
  detailsChanged:
    initial.name !== values.name ||
    (initial.address ?? "").trim() !== (values.address ?? "").trim() ||
    speakerIds(initial) !== speakerIds(values),
  scheduleMoved:
    !sameInstant(startOf(initial), startOf(values)) ||
    !sameInstant(endOf(initial), endOf(values)),
  dayMoved: !sameDay(initial.date, values.date),
  ruleChanged: !sameRecurrence(initial.recurrence, values.recurrence),
});

// What to tell the user before saving, so nothing happens by surprise.
export const impactMessages = (
  change: EventChange,
  option: EditOption,
  repeats: boolean,
): string[] => {
  const messages: string[] = [];
  if (repeats && option === "THIS_EVENT") {
    messages.push("Este evento dejará de ser parte de la serie.");
  }
  if (
    repeats &&
    option !== "THIS_EVENT" &&
    (change.ruleChanged || change.dayMoved)
  ) {
    messages.push(
      "Al cambiar el día o cómo se repite, los eventos que ya pasaron o que tienen inscritos o asistencia no cambian: quedan como eventos sueltos. Los demás se reemplazan.",
    );
  }
  if (change.scheduleMoved || change.detailsChanged) {
    messages.push(
      "Las personas inscritas recibirán un correo si cambia la fecha, la hora, el nombre, el lugar o los ponentes.",
    );
  }
  return messages;
};

// Stopping a series is deleting "this and the following", not editing: the
// API keeps the rule when none is sent.
export const STOP_REPEATING_MESSAGE =
  'Para que el evento deje de repetirse, elimina "Este y los eventos siguientes".';

type RequestContext = Readonly<{
  nodeId: string;
  initial: EventDetailFormData;
  values: EventDetailFormData;
  option: EditOption;
  // The event belongs to a series.
  repeats: boolean;
  timeZone: string;
}>;

// The body of PUT /events/{id}. The rule is sent only when it can apply: a
// single event may start repeating; for a series, only when the user changed
// it and the change reaches more than this event. The zone goes with a new
// rule, and always for a single event (it names the zone of the emails).
export const toEditRequest = ({
  nodeId,
  initial,
  values,
  option,
  repeats,
  timeZone,
}: RequestContext): EditEventRequest => {
  const change = describeChange(initial, values);
  const sendRule = repeats
    ? option !== "THIS_EVENT" && change.ruleChanged
    : true;
  const recurrence: RecurrenceRequest | undefined = sendRule
    ? toRecurrenceRequest(values.recurrence, values.date)
    : undefined;
  return {
    name: values.name,
    address: values.address,
    description: values.description,
    organizationId: nodeId,
    isACourse: values.type === 1,
    speakerIds: values.speakers.map((speaker) => speaker.id),
    startTime: format(startOf(values), "yyyy-MM-dd'T'HH:mm:ssXXX"),
    endTime: format(endOf(values), "yyyy-MM-dd'T'HH:mm:ssXXX"),
    option,
    recurrence,
    timeZone: !repeats || recurrence ? timeZone : undefined,
  };
};
