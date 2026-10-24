"use client";

import { MuiTelInput } from "mui-tel-input";
import { Controller, useFormContext } from "react-hook-form-mui";

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
        <MuiTelInput
          name={field.name}
          value={field.value}
          onChange={(value) => {
            field.onChange(value.replace(/\s+/g, ""));
          }}
          error={Boolean(errors[name])}
          helperText={errors[name]?.message as string | undefined}
          fullWidth
          label="Teléfono"
          onlyCountries={["PE", "CO"]}
        />
      )}
    />
  );
};
