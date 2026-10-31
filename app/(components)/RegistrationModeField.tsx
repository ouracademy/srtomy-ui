"use client";

import { Typography } from "@mui/material";
import { SelectElement, useFormContext } from "react-hook-form-mui";
import type { EventDetailFormData } from "./EventForm";
import {
  describeRegistrationMode,
  REGISTRATION_MODES,
} from "./registrationMode";

// How a sub-event is entered. Must be rendered inside the EventForm's
// FormContainer.
export const RegistrationModeField = () => {
  const form = useFormContext<EventDetailFormData>();
  const mode = form.watch("registrationMode");

  return (
    <>
      <SelectElement
        fullWidth
        name="registrationMode"
        label="Inscripción"
        options={REGISTRATION_MODES.map(({ id, label }) => ({ id, label }))}
      />
      <Typography variant="caption" color="text.secondary">
        {describeRegistrationMode(mode)?.help}
      </Typography>
    </>
  );
};
