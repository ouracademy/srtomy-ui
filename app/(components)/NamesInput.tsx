"use client";

import { Autocomplete, Chip, TextField } from "@mui/material";
import { Controller, useFormContext } from "react-hook-form-mui";

type NamesInputProps = Readonly<{
  name: string;
  label: string;
  suggestions: string[];
  helperText?: string;
}>;

// A free list of names with autocomplete: the user picks suggestions or types
// any other name and presses Enter. Used for positions (cargos), whose wording
// each church chooses.
export const NamesInput = ({
  name,
  label,
  suggestions,
  helperText,
}: NamesInputProps) => {
  const { control } = useFormContext();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Autocomplete
          multiple
          freeSolo
          options={suggestions}
          value={field.value as string[]}
          onChange={(_event, value) => field.onChange(dedupe(value))}
          renderValue={(values, getItemProps) =>
            values.map((option, index) => {
              const { key, ...itemProps } = getItemProps({ index });
              return <Chip key={key} label={option} {...itemProps} />;
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={label}
              placeholder="Escriba un nombre y presione Enter"
              helperText={helperText}
            />
          )}
        />
      )}
    />
  );
};

/** Same name with different case or spaces counts once (first spelling wins). */
export const dedupe = (names: string[]) => {
  const seen = new Set<string>();
  return names
    .map((name) => name.trim())
    .filter((name) => {
      const key = name.toLocaleLowerCase("es");
      if (!name || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};
