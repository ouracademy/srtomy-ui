import { isSameDay, set, startOfDay, subDays } from "date-fns";

type Selection = { start: Date; end: Date; allDay?: boolean };

// What the form starts with after choosing a time range on the calendar.
// Picking days in the "Varios días" row, or dragging across days, starts a
// multi-day event; a single day keeps the usual hours.
export function initialRange({ start, end, allDay = false }: Selection) {
  if (allDay) {
    // The end of an all-day selection is the day after its last day.
    const lastDay = subDays(end, 1);
    const several = !isSameDay(start, lastDay);
    return {
      date: start,
      endDate: several ? lastDay : null,
      startTime: set(start, { hours: 9, minutes: 0 }),
      endTime: set(several ? lastDay : start, { hours: 13, minutes: 0 }),
    };
  }
  // Dragging until midnight ends the day before.
  const lastDay =
    end.getTime() === startOfDay(end).getTime() ? subDays(end, 1) : end;
  const several = !isSameDay(start, lastDay);
  return {
    date: start,
    endDate: several ? lastDay : null,
    startTime: start,
    endTime: end,
  };
}
