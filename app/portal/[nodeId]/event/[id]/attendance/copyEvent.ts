import { format } from "date-fns";
import type { CopyEventRequest } from "@/app/(api)/generated/aPIOvejafiel.schemas";

// The name a copy starts with.
export const copyName = (title: string) => `${title} (copia)`;

// The body of POST /events/{id}/copy: the copy starts on the chosen day (as
// "yyyy-MM-dd", what a date field gives) at the same time of day as the
// original, so every sub-event keeps its place in the program.
export const toCopyRequest = (
  original: Date,
  day: string,
  name: string,
): CopyEventRequest => {
  const [year, month, date] = day.split("-").map(Number);
  const start = new Date(
    year ?? original.getFullYear(),
    (month ?? 1) - 1,
    date ?? 1,
    original.getHours(),
    original.getMinutes(),
  );
  return {
    startTime: format(start, "yyyy-MM-dd'T'HH:mm:ssXXX"),
    name: name.trim() || undefined,
  };
};
