// The look of the fields of the redesigned forms: a grey fill with rounded
// corners and no underline, as in the search boxes of Personas and Grupos.

const noUnderline = { "&::before, &::after": { display: "none" } };

// For a TextField (or Autocomplete) with `variant="filled"`.
export const filledTextFieldSx = {
  "& .MuiFilledInput-root": { borderRadius: 3, ...noUnderline },
};

// For a date or time picker whose text field is `variant="filled"`.
export const filledPickerSx = {
  width: "100%",
  "& .MuiPickersFilledInput-root": { borderRadius: 3, ...noUnderline },
};

export const filledPickerField = { variant: "filled" } as const;
