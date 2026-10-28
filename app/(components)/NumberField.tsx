"use client";

import { TextField } from "@mui/material";
import { useState } from "react";

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
export const NumberField = ({
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
