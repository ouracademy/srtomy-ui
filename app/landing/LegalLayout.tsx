"use client";

import Box from "@mui/material/Box";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { landingTheme } from "./theme";

// Frame of the legal pages and the complaints book: same header and footer as
// the landing, with the page pushed apart so the footer sits at the bottom.
export function LegalLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <ThemeProvider theme={landingTheme}>
      <Box
        sx={(theme) => ({
          fontFamily: theme.typography.fontFamily,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          bgcolor: "background.default",
          color: "text.primary",
        })}
      >
        <LandingHeader />
        <Box component="main" sx={{ flex: 1 }}>
          {children}
        </Box>
        <LandingFooter />
      </Box>
    </ThemeProvider>
  );
}
