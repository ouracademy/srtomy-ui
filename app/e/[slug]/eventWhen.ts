import { format } from "date-fns";
import { es } from "date-fns/locale";

const weekdays = [
  "domingos",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábados",
];

const listed = (items: string[]) =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;

type When = {
  start?: Date;
  end?: Date;
  daysOfWeek?: number[];
  endRecur?: string;
};

// When an event happens, in words: "sábado 5 de enero de 2030, 10:00 a 12:00",
// or, for a recurring one, "Los lunes y miércoles, 10:00 a 12:00, hasta el
// 14 de enero de 2026". A missing date reads as nothing rather than "Invalid".
export const eventWhen = ({ start, end, daysOfWeek, endRecur }: When) => {
  if (!start) return "";
  const hours = end
    ? `${format(start, "HH:mm")} a ${format(end, "HH:mm")}`
    : format(start, "HH:mm");
  if (daysOfWeek && daysOfWeek.length > 0) {
    const days = listed(
      [...daysOfWeek].sort((a, b) => a - b).map((day) => weekdays[day] ?? ""),
    );
    const until = endRecur
      ? `, hasta el ${format(new Date(`${endRecur}T00:00:00`), "d 'de' MMMM 'de' yyyy", { locale: es })}`
      : "";
    return `Los ${days}, ${hours}${until}`;
  }
  return `${format(start, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}, ${hours}`;
};
