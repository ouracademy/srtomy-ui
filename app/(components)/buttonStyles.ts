import type { SxProps, Theme } from "@mui/material/styles";

// Filled button with enough contrast for white text (#2563EB on white is
// 5.2:1; WCAG AA needs 4.5:1). The same blue as SaveButton.
export const primaryButtonSx: SxProps<Theme> = {
  background: "#2563EB",
  color: "#fff",
  "&:hover": { background: "#1D4ED8" },
  "&.Mui-disabled": { background: "#E5E7EB", color: "#4B5563" },
};
