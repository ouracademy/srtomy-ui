"use client";

import { Box, Grid, Typography } from "@mui/material";
import { CheckboxElement, useFormContext } from "react-hook-form-mui";
import { DatePickerElement } from "react-hook-form-mui/date-pickers";
import type { EventDetailFormData } from "./EventForm";
import { WeekChips } from "./WeekChips";

// "Se repite" checkbox and, when checked, the weekdays and end date. Must be
// rendered inside the EventForm's FormContainer.
export const RecurrenceFields = () => {
  const form = useFormContext<EventDetailFormData>();
  const isRecurrent = form.watch("isRecurrent");
  const daysOfWeek = form.watch("daysOfWeek");

  return (
    <>
      <CheckboxElement
        onChange={(e) => {
          if (e.target.checked) {
            const date = form.getValues().date;
            form.setValue("daysOfWeek", date ? [date.getDay()] : []);
          } else {
            form.setValue("daysOfWeek", []);
          }
        }}
        name="isRecurrent"
        label="Se repite"
      />
      {isRecurrent && (
        <Box>
          <Typography sx={{ padding: "10px 0px" }}>Repetir el</Typography>
          <WeekChips
            chipsValue={daysOfWeek}
            onChange={(daysOfWeek) => form.setValue("daysOfWeek", daysOfWeek)}
          />
          <Box
            sx={{
              padding: "20px 0px",
              display: { xs: "block", sm: "flex" },
              alignItems: "center",
            }}
          >
            <Typography sx={{ paddingRight: "10px" }}>Finaliza el:</Typography>
            <Grid size={{ xs: 12, sm: 4 }}>
              <DatePickerElement
                name="endRecur"
                inputProps={{
                  sx: {
                    width: "100%",
                  },
                }}
              />
            </Grid>
          </Box>
        </Box>
      )}
    </>
  );
};
