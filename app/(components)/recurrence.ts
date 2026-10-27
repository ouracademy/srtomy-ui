import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { z } from "zod";
import type {
  RecurrenceRequest,
  RecurrenceResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";

const FREQUENCIES = ["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"] as const;

export type RepeatFrequency = (typeof FREQUENCIES)[number];

// How an event repeats, as the form edits it. "NONE" is an event that does
// not repeat.
export const recurrenceSchema = z
  .object({
    frequency: z.enum(FREQUENCIES),
    interval: z.number().int().min(1).max(99),
    // 0 = Sunday ... 6 = Saturday (same as Date#getDay and the API).
    daysOfWeek: z.array(z.number().int().min(0).max(6)),
    monthlyMode: z.enum(["DAY_OF_MONTH", "NTH_WEEKDAY"]),
    endType: z.enum(["NEVER", "UNTIL", "COUNT"]),
    until: z.date().nullable(),
    count: z.number().int().min(1).max(1000),
  })
  .superRefine((value, context) => {
    if (value.frequency === "WEEKLY" && value.daysOfWeek.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["daysOfWeek"],
        message: "Elige al menos un día de la semana",
      });
    }
    if (
      value.frequency !== "NONE" &&
      value.endType === "UNTIL" &&
      !value.until
    ) {
      context.addIssue({
        code: "custom",
        path: ["until"],
        message: "Elige la fecha en la que termina",
      });
    }
  });

export type RecurrenceFormData = z.infer<typeof recurrenceSchema>;

export const noRecurrence = (): RecurrenceFormData => ({
  frequency: "NONE",
  interval: 1,
  daysOfWeek: [],
  monthlyMode: "DAY_OF_MONTH",
  endType: "NEVER",
  until: null,
  count: 10,
});

const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const ORDINALS = ["primer", "segundo", "tercer", "cuarto", "último"];

// "primer lunes", "último viernes": the fifth weekday of a month is the last.
export const nthWeekdayLabel = (date: Date): string => {
  const nth = Math.min(Math.floor((date.getDate() - 1) / 7), 4);
  return `${ORDINALS[nth]} ${WEEKDAYS[date.getDay()]}`;
};

const UNITS: Record<Exclude<RepeatFrequency, "NONE">, [string, string]> = {
  DAILY: ["día", "días"],
  WEEKLY: ["semana", "semanas"],
  MONTHLY: ["mes", "meses"],
  YEARLY: ["año", "años"],
};

export const unitLabel = (
  frequency: Exclude<RepeatFrequency, "NONE">,
  interval: number,
): string => UNITS[frequency][interval === 1 ? 0 : 1];

const joinWithY = (items: string[]): string =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;

// A sentence like Google Calendar's: "Semanalmente el lunes y miércoles, hasta
// el 14 de enero de 2026". `date` is the day of the first occurrence.
export const describeRecurrence = (
  recurrence: RecurrenceFormData,
  date: Date,
): string => {
  const { frequency, interval } = recurrence;
  if (frequency === "NONE") return "No se repite";

  const every = interval === 1 ? undefined : interval;
  let sentence: string;
  switch (frequency) {
    case "DAILY":
      sentence = every ? `Cada ${every} días` : "Todos los días";
      break;
    case "WEEKLY": {
      const days = recurrence.daysOfWeek.length
        ? [...recurrence.daysOfWeek].sort(
            (a, b) => ((a + 6) % 7) - ((b + 6) % 7),
          )
        : [date.getDay()];
      const names = days.map((day) => WEEKDAYS[day] ?? "");
      sentence = `${every ? `Cada ${every} semanas` : "Semanalmente"} el ${joinWithY(names)}`;
      break;
    }
    case "MONTHLY": {
      const base = every ? `Cada ${every} meses` : "Mensualmente";
      sentence =
        recurrence.monthlyMode === "NTH_WEEKDAY"
          ? `${base} el ${nthWeekdayLabel(date)}`
          : `${base} el día ${date.getDate()}`;
      break;
    }
    case "YEARLY":
      sentence = `${every ? `Cada ${every} años` : "Anualmente"} el ${format(date, "d 'de' MMMM", { locale: es })}`;
      break;
  }

  switch (recurrence.endType) {
    case "UNTIL":
      return recurrence.until
        ? `${sentence}, hasta el ${format(recurrence.until, "d 'de' MMMM 'de' yyyy", { locale: es })}`
        : sentence;
    case "COUNT":
      return `${sentence}, ${recurrence.count} ${recurrence.count === 1 ? "vez" : "veces"}`;
    case "NEVER":
      return sentence;
  }
};

// The body of POST /events for the recurrence; undefined for a single event.
export const toRecurrenceRequest = (
  recurrence: RecurrenceFormData,
  date: Date,
): RecurrenceRequest | undefined => {
  if (recurrence.frequency === "NONE") return undefined;
  return {
    frequency: recurrence.frequency,
    interval: recurrence.interval,
    daysOfWeek:
      recurrence.frequency === "WEEKLY"
        ? recurrence.daysOfWeek.length
          ? recurrence.daysOfWeek
          : [date.getDay()]
        : undefined,
    monthlyMode:
      recurrence.frequency === "MONTHLY" ? recurrence.monthlyMode : undefined,
    endType: recurrence.endType,
    until:
      recurrence.endType === "UNTIL" && recurrence.until
        ? format(recurrence.until, "yyyy-MM-dd")
        : undefined,
    count: recurrence.endType === "COUNT" ? recurrence.count : undefined,
  };
};

// The recurrence the API returns for an event of a series; no recurrence means
// the event does not repeat.
export const fromRecurrenceResponse = (
  response: RecurrenceResponse | undefined,
): RecurrenceFormData => {
  if (!response?.frequency) return noRecurrence();
  return {
    frequency: response.frequency,
    interval: response.interval ?? 1,
    daysOfWeek: response.daysOfWeek ?? [],
    monthlyMode: response.monthlyMode ?? "DAY_OF_MONTH",
    endType: response.endType ?? "NEVER",
    until: response.until ? parseISO(response.until) : null,
    count: response.count ?? 10,
  };
};
