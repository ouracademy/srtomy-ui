import { isSameDay, set } from "date-fns";

type RangeFields = {
  date: Date;
  // The day the event ends; the same as `date` for an event of one day.
  endDate: Date;
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
  end: onDay(endDate, endTime),
});

export const lastsSeveralDays = (
  fields: Pick<RangeFields, "date" | "endDate">,
) => !isSameDay(fields.date, fields.endDate);
