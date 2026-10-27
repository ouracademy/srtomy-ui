"use client";

import {
  Box,
  FormControlLabel,
  FormHelperText,
  MenuItem,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { useState } from "react";
import { useFormContext } from "react-hook-form-mui";
import type { EventDetailFormData } from "./EventForm";
import {
  describeRecurrence,
  nthWeekdayLabel,
  unitLabel,
  type RecurrenceFormData,
  type RepeatFrequency,
} from "./recurrence";
import { WeekChips } from "./WeekChips";

const FREQUENCY_OPTIONS: { value: RepeatFrequency; label: string }[] = [
  { value: "NONE", label: "No se repite" },
  { value: "DAILY", label: "Todos los días" },
  { value: "WEEKLY", label: "Semanalmente" },
  { value: "MONTHLY", label: "Mensualmente" },
  { value: "YEARLY", label: "Anualmente" },
];

type NumberFieldProps = Readonly<{
  label: string;
  value: number;
  max: number;
  width: number;
  disabled?: boolean;
  onCommit: (value: number) => void;
}>;

// A whole number between 1 and max. While typing the field may be empty; the
// number is reported once it is valid and clamped when it is too big.
const NumberField = ({
  label,
  value,
  max,
  width,
  disabled,
  onCommit,
}: NumberFieldProps) => {
  const [text, setText] = useState(String(value));

  return (
    <TextField
      label={label}
      type="number"
      size="small"
      sx={{ width }}
      value={text}
      disabled={disabled}
      onChange={(event) => {
        const raw = event.target.value;
        if (raw === "") {
          setText("");
          return;
        }
        const next = Math.min(max, Math.max(1, Math.trunc(Number(raw)) || 1));
        setText(String(next) === raw ? raw : String(next));
        onCommit(next);
      }}
      onBlur={() => setText(String(value))}
      slotProps={{ htmlInput: { min: 1, max } }}
    />
  );
};

type RecurrenceFieldsProps = Readonly<{
  // Shows how the event repeats as text, without controls.
  readOnly?: boolean;
}>;

// How the event repeats, like Google Calendar: every N days/weeks/months/years,
// on some weekdays or the same day of the month, ending never, on a date or
// after some times. Must be rendered inside the EventForm's FormContainer.
export const RecurrenceFields = ({
  readOnly = false,
}: RecurrenceFieldsProps) => {
  const form = useFormContext<EventDetailFormData>();
  const recurrence = form.watch("recurrence");
  const date = form.watch("date");
  const errors = form.formState.errors.recurrence;

  const change = (changes: Partial<RecurrenceFormData>) =>
    form.setValue(
      "recurrence",
      { ...form.getValues("recurrence"), ...changes },
      { shouldDirty: true, shouldValidate: form.formState.isSubmitted },
    );

  if (readOnly) {
    return (
      <Typography aria-label="Repetición">
        {describeRecurrence(recurrence, date)}
      </Typography>
    );
  }

  const { frequency } = recurrence;

  return (
    <Stack spacing={2}>
      <TextField
        select
        label="Se repite"
        value={frequency}
        onChange={(event) => {
          const next = event.target.value as RepeatFrequency;
          change({
            frequency: next,
            // A weekly event starts on the weekday of its date.
            daysOfWeek:
              next === "WEEKLY" && recurrence.daysOfWeek.length === 0
                ? [date.getDay()]
                : recurrence.daysOfWeek,
          });
        }}
      >
        {FREQUENCY_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
      {frequency !== "NONE" && (
        <>
          <Stack direction="row" spacing={1} alignItems="center">
            <NumberField
              label="Cada"
              value={recurrence.interval}
              max={99}
              width={90}
              onCommit={(interval) => change({ interval })}
            />
            <Typography>{unitLabel(frequency, recurrence.interval)}</Typography>
          </Stack>
          {frequency === "WEEKLY" && (
            <Box>
              <Typography sx={{ padding: "10px 0px" }}>Repetir el</Typography>
              <WeekChips
                chipsValue={recurrence.daysOfWeek}
                onChange={(daysOfWeek) => change({ daysOfWeek })}
              />
              {errors?.daysOfWeek?.message && (
                <FormHelperText error>
                  {errors.daysOfWeek.message}
                </FormHelperText>
              )}
            </Box>
          )}
          {frequency === "MONTHLY" && (
            <TextField
              select
              label="Se repite el"
              value={recurrence.monthlyMode}
              onChange={(event) =>
                change({
                  monthlyMode: event.target
                    .value as RecurrenceFormData["monthlyMode"],
                })
              }
            >
              <MenuItem value="DAY_OF_MONTH">
                {`Día ${date.getDate()} del mes`}
              </MenuItem>
              <MenuItem value="NTH_WEEKDAY">
                {`El ${nthWeekdayLabel(date)} del mes`}
              </MenuItem>
            </TextField>
          )}
          <Box>
            <Typography id="recurrence-end">Termina</Typography>
            <RadioGroup
              aria-labelledby="recurrence-end"
              value={recurrence.endType}
              onChange={(event) =>
                change({
                  endType: event.target.value as RecurrenceFormData["endType"],
                })
              }
            >
              <FormControlLabel
                value="NEVER"
                control={<Radio />}
                label="Nunca"
              />
              <Stack direction="row" alignItems="center" spacing={1}>
                <FormControlLabel
                  value="UNTIL"
                  control={<Radio />}
                  label="El"
                />
                <DatePicker
                  label="Fecha de fin"
                  value={recurrence.until}
                  disabled={recurrence.endType !== "UNTIL"}
                  minDate={date}
                  onChange={(until) => change({ until })}
                  slotProps={{ textField: { size: "small" } }}
                />
              </Stack>
              {errors?.until?.message && (
                <FormHelperText error>{errors.until.message}</FormHelperText>
              )}
              <Stack direction="row" alignItems="center" spacing={1}>
                <FormControlLabel
                  value="COUNT"
                  control={<Radio />}
                  label="Después de"
                />
                <NumberField
                  label="Repeticiones"
                  value={recurrence.count}
                  max={1000}
                  width={120}
                  disabled={recurrence.endType !== "COUNT"}
                  onCommit={(count) => change({ count })}
                />
              </Stack>
            </RadioGroup>
          </Box>
          <Typography color="text.secondary" variant="body2">
            {describeRecurrence(recurrence, date)}
          </Typography>
        </>
      )}
    </Stack>
  );
};
