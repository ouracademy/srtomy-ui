import { isSameDay, set } from "date-fns";

type RangeFields = {
  date: Date;
  // The last day of an event that lasts several days; null when it ends the
  // same day it starts.
  endDate: Date | null;
  startTime: Date;
  endTime: Date;
};

const onDay = (day: Date, time: Date) =>
  set(day, {
    hours: time.getHours(),
    minutes: time.getMinutes(),
    seconds: 0,
    milliseconds: 0,
  });

// The form keeps the day and the time of day apart (the time pickers carry the
// day they were opened on), so the real start and end are put together here.
export const eventRange = ({
  date,
  endDate,
  startTime,
  endTime,
}: RangeFields) => ({
  start: onDay(date, startTime),
  end: onDay(endDate ?? date, endTime),
});

export const lastsSeveralDays = (
  fields: Pick<RangeFields, "date" | "endDate">,
) => fields.endDate !== null && !isSameDay(fields.date, fields.endDate);
