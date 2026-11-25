const settle = "transform .5s cubic-bezier(.34, 1.56, .64, 1)";

// Two separate buttons to choose one of two kinds (Evento or Curso): outlined
// when idle, solid blue when chosen, and a soft press that settles back. The
// effect lives in `transition`, so it only runs on a click.
export const typeButtonsSx = (height: number) => ({
  height,
  gap: 1.25,
  // MUI glues the buttons of a group together; they stay apart here.
  "&&& .MuiToggleButton-root": {
    minWidth: 132,
    gap: 1,
    px: 2.75,
    marginLeft: 0,
    border: 1.5,
    borderStyle: "solid",
    borderColor: "grey.400",
    borderRadius: 2,
    color: "text.primary",
    fontWeight: 600,
    letterSpacing: "0.06em",
    transition: `${settle}, background-color .3s ease, border-color .3s ease, color .3s ease`,
    "&:hover": { bgcolor: "transparent" },
    "&:active:not(.Mui-disabled)": {
      transform: "scale(.96)",
      transition: "transform .12s ease-out",
    },
    // The default selected look (primary text on a pale wash) is under the
    // 4.5:1 contrast of WCAG AA.
    "&.Mui-selected": {
      bgcolor: "primary.dark",
      borderColor: "primary.dark",
      color: "#ffffff",
      "&:hover": { bgcolor: "primary.dark" },
    },
    "&.Mui-disabled": { opacity: 0.55, color: "text.primary" },
    "&.Mui-selected.Mui-disabled": { color: "#ffffff" },
    "@media (prefers-reduced-motion: reduce)": {
      transition: "none",
      "&:active:not(.Mui-disabled)": { transform: "none" },
    },
  },
});
