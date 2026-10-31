import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import type { MonthResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";

/** "2026-10" -> "oct 26" (short label for the chart axis). */
export const monthLabel = (month: string | undefined) => {
  if (!month) return "";
  const date = parse(month, "yyyy-MM", new Date());
  return Number.isNaN(date.getTime())
    ? month
    : format(date, "MMM yy", { locale: es });
};

/** "2026-10" -> "octubre de 2026" (long label for the table and screen readers). */
export const monthLongLabel = (month: string | undefined) => {
  if (!month) return "";
  const date = parse(month, "yyyy-MM", new Date());
  return Number.isNaN(date.getTime())
    ? month
    : format(date, "MMMM 'de' yyyy", { locale: es });
};

const people = (count: number) =>
  count === 1 ? "1 persona" : `${count} personas`;

/** One sentence that answers "does the church grow?" for the months shown. */
export const summarizeGrowth = (months: MonthResponse[]) => {
  const joined = months.reduce((sum, month) => sum + (month.joined ?? 0), 0);
  const left = months.reduce((sum, month) => sum + (month.left ?? 0), 0);
  const becameMember = months.reduce(
    (sum, month) => sum + (month.becameMember ?? 0),
    0,
  );
  const period =
    months.length === 1
      ? "el último mes"
      : `los últimos ${months.length} meses`;
  if (joined === 0 && becameMember === 0 && left === 0) {
    return `En ${period} no hubo cambios.`;
  }
  const parts = [
    joined === 1 ? "se sumó 1 persona" : `se sumaron ${people(joined)}`,
    becameMember === 1
      ? "1 pasó a ser miembro"
      : `${becameMember} pasaron a ser miembros`,
  ];
  if (left > 0) {
    parts.push(left === 1 ? "1 salió" : `${left} salieron`);
  }
  const last = parts.pop() ?? "";
  return `En ${period} ${parts.join(", ")} y ${last}.`;
};

export type Bar = {
  month: string;
  /** Height in pixels of the whole column (everyone). */
  total: number;
  /** Height in pixels of the members part of the column. */
  members: number;
};

/** Scales people and members at each month's end to a chart of `height` pixels. */
export const chartBars = (months: MonthResponse[], height: number): Bar[] => {
  const max = Math.max(1, ...months.map((month) => month.peopleAtEnd ?? 0));
  return months.map((month) => ({
    month: month.month ?? "",
    total: Math.round(((month.peopleAtEnd ?? 0) / max) * height),
    members: Math.round(((month.membersAtEnd ?? 0) / max) * height),
  }));
};
