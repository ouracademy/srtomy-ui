import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { RecurrenceResponse } from "@/app/(api)/generated/aPISrTommy.schemas";
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
  return `${format(start, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}, ${hours}`;
};
