import { format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

// "vie 13 nov", or "vie 13 nov a dom 15 nov" when it lasts several days.
export const dateRangeLabel = (start?: Date, end?: Date): string => {
  if (!start) return "Sin fecha";
  const day = (date: Date) => format(date, "EEE d MMM", { locale: es });
  if (!end || isSameDay(start, end)) return day(start);
  return `${day(start)} a ${day(end)}`;
};

// "09:00 a 20:00".
export const hoursLabel = (start?: Date, end?: Date): string =>
  start && end ? `${format(start, "HH:mm")} a ${format(end, "HH:mm")}` : "";

// Who can open the event through its link, as the badge of the header says it.
export const accessLabel = (generalAccess?: string): string | undefined => {
  switch (generalAccess) {
    case "ANYONE_WITH_LINK":
      return "Público: cualquiera con el enlace";
    case "CHURCH":
      return "Solo la iglesia: con el enlace";
    case "RESTRICTED":
      return "Privado: solo con acceso";
    default:
      return undefined;
  }
};
