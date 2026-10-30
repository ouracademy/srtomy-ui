"use client";

import Box from "@mui/material/Box";
import { ThemeProvider } from "@mui/material/styles";
import { Features } from "./Features";
import { FinalCta } from "./FinalCta";
import { Hero } from "./Hero";
import { LandingFooter } from "./LandingFooter";
import { LandingHeader } from "./LandingHeader";
import { Pricing } from "./Pricing";
import { Roles } from "./Roles";
import { Steps } from "./Steps";
import { landingTheme } from "./theme";

// Client boundary of the landing: the theme object cannot cross from a server
// component, and the header reads the Auth0 session.
export function LandingPage() {
  return (
    <ThemeProvider theme={landingTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "background.default",
          color: "text.primary",
        }}
      >
        <LandingHeader />
        <Box component="main">
          <Hero />
          <Features />
          <Steps />
          <Roles />
          <Pricing />
          <FinalCta />
        </Box>
        <LandingFooter />
      </Box>
    </ThemeProvider>
  );
}
