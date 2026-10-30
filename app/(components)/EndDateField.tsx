"use client";

import { isBefore, isSameDay, startOfDay } from "date-fns";
import { useEffect, useRef } from "react";
import { useFormContext } from "react-hook-form-mui";
import { DatePickerElement } from "react-hook-form-mui/date-pickers";
import type { EventDetailFormData } from "./EventForm";
import { lastsSeveralDays } from "./eventRange";
import { noRecurrence } from "./recurrence";

// The day the event ends, next to the day it starts: an event of several days
// (a conference, a retreat) is one whose end day is another one. Must be
// rendered inside the EventForm's FormContainer.
export const EndDateField = () => {
  const form = useFormContext<EventDetailFormData>();
  const date = form.watch("date");
  const endDate = form.watch("endDate");
  const repeats = form.watch("recurrence").frequency !== "NONE";
  const severalDays = lastsSeveralDays({ date, endDate });
  const previousDate = useRef(date);

  // The end follows the start while the event is of one day, and is never
  // before it.
  useEffect(() => {
    const previous = previousDate.current;
    previousDate.current = date;
    if (previous.getTime() === date.getTime()) return;
    if (
      isSameDay(previous, endDate) ||
      isBefore(startOfDay(endDate), startOfDay(date))
    ) {
      form.setValue("endDate", date, { shouldDirty: true });
    }
  }, [date, endDate, form]);

  // An event that lasts days does not also repeat.
  useEffect(() => {
    if (severalDays && repeats) {
      form.setValue("recurrence", noRecurrence(), { shouldDirty: true });
    }
  }, [severalDays, repeats, form]);

  return (
    <DatePickerElement
      sx={{ width: "100%" }}
      label="Hasta"
      name="endDate"
      minDate={date}
      required
    />
  );
};
