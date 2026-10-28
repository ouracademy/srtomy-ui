"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { NumberField } from "./NumberField";
import {
  nthWeekdayLabel,
  recurrenceSchema,
  unitLabel,
  type RecurrenceFormData,
  type RepeatFrequency,
} from "./recurrence";
import { WeekChips } from "./WeekChips";

const UNITS: Exclude<RepeatFrequency, "NONE">[] = [
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
];

type CustomRecurrenceDialogProps = Readonly<{
  // The current recurrence; the dialog edits a draft of it.
  value: RecurrenceFormData;
  // The day of the first occurrence.
  date: Date;
  onCancel: () => void;
  onSave: (value: RecurrenceFormData) => void;
}>;

// Every way an event can repeat: every N days/weeks/months/years, on some
// weekdays or the same day of the month, ending never, on a date or after some
// times. Render it only while it is open, so each opening starts from `value`.
export const CustomRecurrenceDialog = ({
  value,
  date,
  onCancel,
  onSave,
}: CustomRecurrenceDialogProps) => {
  const [draft, setDraft] = useState<RecurrenceFormData>(() =>
    value.frequency === "NONE"
      ? { ...value, frequency: "WEEKLY", daysOfWeek: [date.getDay()] }
      : value,
  );
  const [errors, setErrors] = useState<{ daysOfWeek?: string; until?: string }>(
    {},
  );

  const change = (changes: Partial<RecurrenceFormData>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setErrors({});
  };

  const save = () => {
    const result = recurrenceSchema.safeParse(draft);
    if (result.success) {
      onSave(result.data);
      return;
    }
    const messages: typeof errors = {};
    for (const issue of result.error.issues) {
      if (issue.path[0] === "daysOfWeek") messages.daysOfWeek = issue.message;
      if (issue.path[0] === "until") messages.until = issue.message;
    }
    setErrors(messages);
  };

  const frequency = draft.frequency as Exclude<RepeatFrequency, "NONE">;

  return (
    <Dialog open onClose={onCancel} fullWidth maxWidth="xs">
      <DialogTitle>Recurrencia personalizada</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ paddingTop: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <NumberField
              label="Repetir cada"
              value={draft.interval}
              max={99}
              width={120}
              onCommit={(interval) => change({ interval })}
            />
            <TextField
              select
              size="small"
              label="Unidad"
              value={frequency}
              sx={{ minWidth: 120 }}
              onChange={(event) => {
                const next = event.target.value as typeof frequency;
                change({
                  frequency: next,
                  // A weekly event starts on the weekday of its date.
                  daysOfWeek:
                    next === "WEEKLY" && draft.daysOfWeek.length === 0
                      ? [date.getDay()]
                      : draft.daysOfWeek,
                });
              }}
            >
              {UNITS.map((unit) => (
                <MenuItem key={unit} value={unit}>
                  {unitLabel(unit, draft.interval)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          {frequency === "WEEKLY" && (
            <Box>
              <Typography sx={{ padding: "10px 0px" }}>Repetir el</Typography>
              <WeekChips
                chipsValue={draft.daysOfWeek}
                onChange={(daysOfWeek) => change({ daysOfWeek })}
              />
              {errors.daysOfWeek && (
                <FormHelperText error>{errors.daysOfWeek}</FormHelperText>
              )}
            </Box>
          )}
          {frequency === "MONTHLY" && (
            <TextField
              select
              label="Se repite el"
              value={draft.monthlyMode}
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
              value={draft.endType}
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
                  value={draft.until}
                  disabled={draft.endType !== "UNTIL"}
                  minDate={date}
                  onChange={(until) => change({ until })}
                  slotProps={{ textField: { size: "small" } }}
                />
              </Stack>
              {errors.until && (
                <FormHelperText error>{errors.until}</FormHelperText>
              )}
              <Stack direction="row" alignItems="center" spacing={1}>
                <FormControlLabel
                  value="COUNT"
                  control={<Radio />}
                  label="Después de"
                />
                <NumberField
                  label="Repeticiones"
                  value={draft.count}
                  max={1000}
                  width={120}
                  disabled={draft.endType !== "COUNT"}
                  onCommit={(count) => change({ count })}
                />
              </Stack>
            </RadioGroup>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant="contained" onClick={save}>
          Listo
        </Button>
      </DialogActions>
    </Dialog>
  );
};
