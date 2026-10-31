import type { ChildResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { format, startOfDay } from "date-fns";

export type ProgramDay = Readonly<{ day: Date; items: ChildResponse[] }>;

// The sub-events of an event, grouped by the day they start and in order.
export function groupByDay(children: readonly ChildResponse[]): ProgramDay[] {
  const days = new Map<string, { day: Date; items: ChildResponse[] }>();
  const ordered = [...children]
    .filter((child) => child.start)
    .sort((a, b) => (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0));
  for (const child of ordered) {
    const day = startOfDay(child.start as Date);
    const key = format(day, "yyyy-MM-dd");
    const group = days.get(key) ?? { day, items: [] };
    group.items.push(child);
    days.set(key, group);
  }
  return [...days.values()];
}

// What the confirmation to delete an event says: deleting an event that has a
// program takes its sub-events with it.
export const deleteMessage = (subEvents: number): string => {
  const base = "Recuerda que una vez eliminado no podrás recuperarlo";
  if (subEvents === 0) return base;
  const what =
    subEvents === 1 ? "su sub-evento" : `sus ${subEvents} sub-eventos`;
  return `También se eliminará ${what}. ${base}`;
};
