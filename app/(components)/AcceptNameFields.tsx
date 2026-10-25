"use client";

import { Stack, TextField } from "@mui/material";
import type { PersonName } from "@/app/portal/userNames";

type AcceptNameFieldsProps = Readonly<{
  value: PersonName;
  onChange: (value: PersonName) => void;
  // Show what is missing after a first attempt to accept.
  showErrors?: boolean;
}>;

// First and last name of whoever accepts an invitation that did not come with
// a person: the new person of the church is created with them.
export const AcceptNameFields = ({
  value,
  onChange,
  showErrors = false,
}: AcceptNameFieldsProps) => (
  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
    <TextField
      label="Nombre"
      size="small"
      required
      fullWidth
      value={value.firstName}
      onChange={(event) =>
        onChange({ ...value, firstName: event.target.value })
      }
      error={showErrors && value.firstName.trim() === ""}
      helperText={
        showErrors && value.firstName.trim() === "" ? "Ingrese su nombre" : ""
      }
    />
    <TextField
      label="Apellido"
      size="small"
      required
      fullWidth
      value={value.lastName}
      onChange={(event) => onChange({ ...value, lastName: event.target.value })}
      error={showErrors && value.lastName.trim() === ""}
      helperText={
        showErrors && value.lastName.trim() === "" ? "Ingrese su apellido" : ""
      }
    />
  </Stack>
);

export const hasBothNames = (name: PersonName) =>
  name.firstName.trim() !== "" && name.lastName.trim() !== "";
