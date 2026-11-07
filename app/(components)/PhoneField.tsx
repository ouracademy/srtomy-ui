"use client";

import { MuiTelInput } from "mui-tel-input";
import type { SxProps, Theme } from "@mui/material/styles";

type PhoneFieldProps = Readonly<{
  label: string;
  value: string;
  // The number with its country code and without spaces ("+51999888777"), or
  // "" when there is none.
  onChange: (value: string) => void;
  size?: "small" | "medium";
  error?: boolean;
  helperText?: string;
  sx?: SxProps<Theme>;
}>;

// Only the country code of Peru or Colombia and nothing after it: the person
// has not typed a number. It has to be exact, because +519 is Peru and the
// first digit of a number, not a country code.
const onlyCountryCode = /^\+(51|57)$/;

// Phone field with the country picker (Peru by default, Colombia too). It is
// what keeps numbers complete: a phone without its country code cannot be
// reached by WhatsApp, because the same digits belong to different countries.
// Used where the form is not react-hook-form (see TelFieldElement for that).
export const PhoneField = ({
  label,
  value,
  onChange,
  size,
  error,
  helperText,
  sx,
}: PhoneFieldProps) => (
  <MuiTelInput
    label={label}
    value={value}
    onChange={(next) => {
      const compact = next.replaceAll(/\s+/g, "");
      onChange(onlyCountryCode.test(compact) ? "" : compact);
    }}
    defaultCountry="PE"
    onlyCountries={["PE", "CO"]}
    size={size}
    error={error}
    helperText={helperText}
    sx={sx}
    fullWidth
  />
);
