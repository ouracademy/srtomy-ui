"use client";

import { FormControlLabel, Switch } from "@mui/material";
import { addDays } from "date-fns";
import { useFormContext } from "react-hook-form-mui";
import { DatePickerElement } from "react-hook-form-mui/date-pickers";
import type { EventDetailFormData } from "./EventForm";
import { noRecurrence } from "./recurrence";

// Lets an event last several days (a conference, a retreat): the last day is
// asked for next to the end time. Must be rendered inside the EventForm's
// FormContainer.
export const MultiDayFields = () => {
  const form = useFormContext<EventDetailFormData>();
  const date = form.watch("date");
  const endDate = form.watch("endDate");

  const toggle = (several: boolean) => {
    form.setValue("endDate", several ? addDays(date, 1) : null, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });
    if (several) {
      // An event that lasts days does not also repeat.
      form.setValue("recurrence", noRecurrence(), { shouldDirty: true });
    }
  };

  return (
    <>
      <FormControlLabel
        label="Dura varios días"
        control={
          <Switch
            checked={endDate !== null}
            onChange={(event) => toggle(event.target.checked)}
          />
        }
      />
      {endDate !== null && (
        <DatePickerElement
          sx={{ width: "100%", marginTop: 1 }}
          label="Hasta"
          name="endDate"
          minDate={date}
          required
        />
      )}
    </>
  );
};
