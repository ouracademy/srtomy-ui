"use client";

import { MuiTelInput } from "mui-tel-input";
import React from "react";
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

// What the form gets: nothing while only the country code is there.
const toValue = (compact: string) =>
  onlyCountryCode.test(compact) ? "" : compact;

// Phone field with the country picker (Peru by default, Colombia too). It is
// what keeps numbers complete: a phone without its country code cannot be
// reached by WhatsApp, because the same digits belong to different countries.
// Used where the form is not react-hook-form (see TelFieldElement for that).
//
// The field keeps what is on screen ("+51") apart from what the form gets (""):
// if the form's empty value were shown back, the code would vanish as soon as
// it appeared and the digits typed next would be read as a country code.
export const PhoneField = ({
  label,
  value,
  onChange,
  size,
  error,
  helperText,
  sx,
}: PhoneFieldProps) => {
  const [text, setText] = React.useState(value);

  // The form changed the value on its own (a reset, or a saved number loaded):
  // show it. Adjusting state while rendering is how React derives it from props.
  if (value !== text && value !== toValue(text)) {
    setText(value);
  }

  return (
    <MuiTelInput
      label={label}
      value={text}
      onChange={(next) => {
        const compact = next.replaceAll(/\s+/g, "");
        setText(compact);
        onChange(toValue(compact));
      }}
      defaultCountry="PE"
      forceCallingCode
      onlyCountries={["PE", "CO"]}
      size={size}
      error={error}
      helperText={helperText}
      sx={sx}
      fullWidth
    />
  );
};
