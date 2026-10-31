import {
  differenceInCalendarDays,
  format,
  startOfDay,
  subDays,
  subMonths,
  subQuarters,
  subYears,
} from "date-fns";
import { es } from "date-fns/locale";

export type RangePreset =
  | "last-week"
  | "last-month"
  | "last-quarter"
  | "last-year"
  | "custom";

/** Fixed-length presets, in the order shown to the user. "custom" opens the date pickers instead of picking a length. */
export const RANGE_PRESETS: Exclude<RangePreset, "custom">[] = [
  "last-week",
  "last-month",
  "last-quarter",
  "last-year",
];

export const RANGE_PRESET_LABELS: Record<RangePreset, string> = {
  "last-week": "Última semana",
  "last-month": "Último mes",
  "last-quarter": "Último trimestre",
  "last-year": "Último año",
  custom: "Personalizado",
};

export type DateRange = Readonly<{ start: Date; end: Date }>;

/** The date a preset means, as a range ending today. */
export const presetToRange = (
  preset: Exclude<RangePreset, "custom">,
  now: Date,
): DateRange => {
  const end = startOfDay(now);
  const start =
    preset === "last-week"
      ? subDays(end, 6)
      : preset === "last-month"
        ? subMonths(end, 1)
        : preset === "last-quarter"
          ? subQuarters(end, 1)
          : subYears(end, 1);
  return { start, end };
};

/** The period of the same length immediately before `start`, for delta comparisons. */
export const previousEquivalentRange = (start: Date, end: Date): DateRange => {
  const lengthInDays = differenceInCalendarDays(end, start) + 1;
  const previousEnd = subDays(startOfDay(start), 1);
  const previousStart = subDays(previousEnd, lengthInDays - 1);
  return { start: previousStart, end: previousEnd };
};

/** "2026-10-01", the date-only format srtomy-api expects for startDate/endDate. */
export const toApiDate = (date: Date) => format(date, "yyyy-MM-dd");

const boundaryLabel = (date: Date) => format(date, "d MMM yyyy", { locale: es });

/** "1 oct 2026 – 20 oct 2026", the label for a custom range. */
export const customRangeLabel = (start: Date, end: Date) =>
  `${boundaryLabel(start)} – ${boundaryLabel(end)}`;

/** What `DateRangeSelector` emits: the chosen range, its label and the period right before it. */
export type DateRangeSelection = Readonly<{
  preset: RangePreset;
  start: Date;
  end: Date;
  label: string;
  previousStart: Date;
  previousEnd: Date;
}>;

/** The full selection for a fixed-length preset, ending today. */
export const selectionForPreset = (
  preset: Exclude<RangePreset, "custom">,
  now: Date,
): DateRangeSelection => {
  const { start, end } = presetToRange(preset, now);
  const { start: previousStart, end: previousEnd } = previousEquivalentRange(
    start,
    end,
  );
  return {
    preset,
    start,
    end,
    previousStart,
    previousEnd,
    label: RANGE_PRESET_LABELS[preset],
  };
};

/** The full selection for a custom range picked by the user. */
export const customSelection = (
  start: Date,
  end: Date,
): DateRangeSelection => {
  const { start: previousStart, end: previousEnd } = previousEquivalentRange(
    start,
    end,
  );
  return {
    preset: "custom",
    start,
    end,
    previousStart,
    previousEnd,
    label: customRangeLabel(start, end),
  };
};
