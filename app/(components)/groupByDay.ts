import { format, startOfDay } from "date-fns";

export type DayGroup<T> = Readonly<{ day: Date; items: T[] }>;

// Items grouped by the day they start and in order, for a program of an event.
// An item without a start is left out.
export function groupByDay<T extends { start?: Date }>(
  items: readonly T[],
): DayGroup<T>[] {
  const days = new Map<string, { day: Date; items: T[] }>();
  const ordered = items
    .filter((item) => item.start)
    .sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0));
  for (const item of ordered) {
    const day = startOfDay(item.start as Date);
    const key = format(day, "yyyy-MM-dd");
    const group = days.get(key) ?? { day, items: [] };
    group.items.push(item);
    days.set(key, group);
  }
  return [...days.values()];
}
