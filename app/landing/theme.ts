import { createTheme } from "@mui/material/styles";

// Colors of the landing that the MUI palette has no slot for. The rest
// (ink, paper, saffron, muted text, divider) lives in the palette below.
export const landingColors = {
  sand: "#F0EEE6",
  inkSurface: "#1E1E1C",
  inkRaised: "#262624",
  inkAvatar: "#3A3A36",
  inkTag: "#2A2A27",
  inkMuted: "#B5B3A9",
  inkRing: "#6B6A64",
  saffronText: "#3B3300",
} as const;

// The landing has its own look (black and white with a saffron accent), so it
// gets its own theme instead of changing the portal's.
export const landingTheme = createTheme({
  palette: {
    primary: { main: "#121212", contrastText: "#FAFAF7" },
    secondary: { main: "#F5B301", contrastText: "#121212" },
    background: { default: "#FAFAF7", paper: "#FFFFFF" },
    text: { primary: "#121212", secondary: "#55554F" },
    divider: "#E4E2DA",
  },
  typography: {
    fontFamily: "var(--font-roboto)",
    button: { textTransform: "none", fontWeight: 500 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 999, minHeight: 44, paddingInline: 20 },
        sizeLarge: {
          minHeight: 52,
          paddingInline: 28,
          fontSize: "1rem",
          fontWeight: 700,
        },
      },
    },
  },
});
