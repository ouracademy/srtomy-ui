import { format, parse } from "date-fns";
import { es } from "date-fns/locale";
import type { Counts } from "@/app/(api)/generated/aPIOvejafiel.schemas";

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

/** Adds up a field across every bucket, treating a missing value as 0. */
export const sumBuckets = <T>(
  buckets: readonly T[],
  pick: (bucket: T) => number | undefined,
) => buckets.reduce((sum, bucket) => sum + (pick(bucket) ?? 0), 0);

/**
 * How `current` changed versus `previous`, as a percentage. `null` means
 * there is nothing to compare against (it went from 0 to something).
 */
export const percentDelta = (
  current: number,
  previous: number,
): number | null => {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
};

/**
 * srtomy-api's `visitors`/`attendees`/`members` counts are cumulative (a
 * member is also counted as an attendee and a visitor), so they cannot be
 * plotted as-is in a pie chart. This splits them into the three exclusive
 * groups that actually add up to `total`.
 */
export const compositionSegments = (current: Counts) => {
  const members = current.members ?? 0;
  const attendees = current.attendees ?? 0;
  const visitors = current.visitors ?? 0;
  return {
    members,
    inProgress: Math.max(attendees - members, 0),
    visitorsOnly: Math.max(visitors - attendees, 0),
  };
};
