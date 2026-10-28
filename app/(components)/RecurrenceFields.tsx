"use client";

import { MenuItem, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useFormContext } from "react-hook-form-mui";
import { CustomRecurrenceDialog } from "./CustomRecurrenceDialog";
import type { EventDetailFormData } from "./EventForm";
import {
  describeRecurrence,
  noRecurrence,
  recurrencePreset,
  type RecurrenceFormData,
  type RecurrencePreset,
} from "./recurrence";

// "CUSTOM" is the current custom rule (shown as its description); "PERSONALIZE"
// is the action that opens the dialog to edit it.
type Choice = RecurrencePreset | "PERSONALIZE";

type RecurrenceFieldsProps = Readonly<{
  // Shows how the event repeats as text, without controls.
  readOnly?: boolean;
}>;

// How the event repeats, like Google Calendar: not at all, every day, every
// week, or a custom rule edited in a dialog. Must be rendered inside the
// EventForm's FormContainer.
export const RecurrenceFields = ({
  readOnly = false,
}: RecurrenceFieldsProps) => {
  const form = useFormContext<EventDetailFormData>();
  const recurrence = form.watch("recurrence");
  const date = form.watch("date");
  const [customOpen, setCustomOpen] = useState(false);

  const set = (value: RecurrenceFormData) =>
    form.setValue("recurrence", value, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });

  if (readOnly) {
    return (
      <Typography aria-label="Repetición">
        {describeRecurrence(recurrence, date)}
      </Typography>
    );
  }

  const preset = recurrencePreset(recurrence, date);

  const choose = (choice: Choice) => {
    switch (choice) {
      case "NONE":
        set(noRecurrence());
        break;
      case "DAILY":
        set({ ...noRecurrence(), frequency: "DAILY" });
        break;
      case "WEEKLY":
        set({
          ...noRecurrence(),
          frequency: "WEEKLY",
          daysOfWeek: [date.getDay()],
        });
        break;
      case "PERSONALIZE":
        setCustomOpen(true);
        break;
      case "CUSTOM":
        break;
    }
  };

  return (
    <>
      <TextField
        select
        label="Se repite"
        value={preset}
        onChange={(event) => choose(event.target.value as Choice)}
      >
        <MenuItem value="NONE">No se repite</MenuItem>
        <MenuItem value="DAILY">Todos los días</MenuItem>
        <MenuItem value="WEEKLY">Todas las semanas</MenuItem>
        {preset === "CUSTOM" && (
          <MenuItem value="CUSTOM">
            {describeRecurrence(recurrence, date)}
          </MenuItem>
        )}
        <MenuItem value="PERSONALIZE">Personalizar…</MenuItem>
      </TextField>
      {customOpen && (
        <CustomRecurrenceDialog
          value={recurrence}
          date={date}
          onCancel={() => setCustomOpen(false)}
          onSave={(value) => {
            set(value);
            setCustomOpen(false);
          }}
        />
      )}
    </>
  );
};
