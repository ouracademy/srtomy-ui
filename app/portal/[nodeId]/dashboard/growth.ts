import { format, parse } from "date-fns";
import { es } from "date-fns/locale";

/** "2026-10" -> "oct 26" (short label for a monthly bucket). */
export const monthLabel = (month: string | undefined) => {
  if (!month) return "";
  const date = parse(month, "yyyy-MM", new Date());
  return Number.isNaN(date.getTime())
    ? month
    : format(date, "MMM yy", { locale: es });
};

/** "2026-10" -> "octubre de 2026" (long label for a monthly bucket). */
export const monthLongLabel = (month: string | undefined) => {
  if (!month) return "";
  const date = parse(month, "yyyy-MM", new Date());
  return Number.isNaN(date.getTime())
    ? month
    : format(date, "MMMM 'de' yyyy", { locale: es });
};

/** "2026-10-01" -> "1 oct" (short label for a daily or weekly bucket). */
export const dayLabel = (day: string | undefined) => {
  if (!day) return "";
  const date = parse(day, "yyyy-MM-dd", new Date());
  return Number.isNaN(date.getTime())
    ? day
    : format(date, "d MMM", { locale: es });
};

/** "2026-10-01" -> "1 de octubre de 2026" (long label for a daily or weekly bucket). */
export const dayLongLabel = (day: string | undefined) => {
  if (!day) return "";
  const date = parse(day, "yyyy-MM-dd", new Date());
  return Number.isNaN(date.getTime())
    ? day
    : format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
};

// srtomy-api buckets a date range automatically: daily and weekly buckets get
// a "yyyy-MM-dd" label (10 characters), monthly buckets get "yyyy-MM" (7).
const isMonthly = (label: string) => label.length === 7;

/** A bucket's label ("2026-10" or "2026-10-01"), formatted in Spanish. */
export const bucketLabel = (label: string | undefined) => {
  if (!label) return "";
  return isMonthly(label) ? monthLabel(label) : dayLabel(label);
};

/** Same as {@link bucketLabel}, spelled out for the table and screen readers. */
export const bucketLongLabel = (label: string | undefined) => {
  if (!label) return "";
  return isMonthly(label) ? monthLongLabel(label) : dayLongLabel(label);
};
