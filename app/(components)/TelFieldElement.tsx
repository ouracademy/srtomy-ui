"use client";

import { Controller, useFormContext } from "react-hook-form-mui";
import { PhoneField } from "./PhoneField";

// Phone field for react-hook-form; stores the number without spaces.
export const TelFieldElement = ({ name }: { name: string }) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <PhoneField
          label="Teléfono"
          value={field.value ?? ""}
          onChange={field.onChange}
          error={Boolean(errors[name])}
          helperText={errors[name]?.message as string | undefined}
        />
      )}
    />
  );
};
