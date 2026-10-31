import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import type { RecurrenceResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import {
  describeRecurrence,
  fromRecurrenceResponse,
} from "@/app/(components)/recurrence";

type When = {
  start?: Date;
  end?: Date;
  // How the event repeats; absent for a one-off event.
  recurrence?: RecurrenceResponse;
};

// When an event happens, in words: "sábado 5 de enero de 2030, 10:00 a 12:00",
// or, for a repeating one, "Semanalmente el lunes y miércoles, hasta el 14 de
// enero de 2026, 10:00 a 12:00". A missing date reads as nothing rather than
// "Invalid".
const day = (date: Date) =>
  format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

export const eventWhen = ({ start, end, recurrence }: When) => {
  if (!start) return "";
  const hours = end
    ? `${format(start, "HH:mm")} a ${format(end, "HH:mm")}`
    : format(start, "HH:mm");
  if (recurrence?.frequency) {
    const repeats = describeRecurrence(
      fromRecurrenceResponse(recurrence),
      start,
    );
    return `${repeats}, ${hours}`;
  }
  // An event that ends another day (a conference) says both days.
  if (end && !isSameDay(start, end)) {
    return `Del ${day(start)}, ${format(start, "HH:mm")} al ${day(end)}, ${format(end, "HH:mm")}`;
  }
  return `${day(start)}, ${hours}`;
};
