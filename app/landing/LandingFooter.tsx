"use client";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { ThemeProvider } from "@mui/material/styles";
import NextLink from "next/link";
import { brandName, contact, legalLinks } from "./content";
import { Wrap } from "./Section";
import { landingColors, landingTheme } from "./theme";

const linkSx = {
  display: "inline-flex",
  alignItems: "center",
  minHeight: 24,
  color: "inherit",
  textDecorationColor: "currentColor",
};

// Client boundary of its own: the legal pages render it outside the landing's
// ThemeProvider, from server components.
export function LandingFooter() {
  return (
    <ThemeProvider theme={landingTheme}>
      <Box
        component="footer"
        sx={(theme) => ({
          fontFamily: theme.typography.fontFamily,
          bgcolor: "#000",
          color: landingColors.inkMuted,
          pt: 4.5,
          pb: 5,
        })}
      >
        <Wrap
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: "24px 32px",
            fontSize: 14,
          }}
        >
          <Box sx={{ display: "grid", gap: 2, alignContent: "start" }}>
            <span>© {brandName}</span>
            <Box component="section" aria-labelledby="footer-contact-title">
              <Typography
                id="footer-contact-title"
                component="h2"
                sx={{ fontSize: 14, fontWeight: 700, color: "#fff", mb: 0.5 }}
              >
                CONTACTO
              </Typography>
              <Box sx={{ display: "grid", gap: 0.5 }}>
                <Link href={`mailto:${contact.email}`} sx={linkSx}>
                  {contact.email}
                </Link>
                <Link
                  href={`tel:+${contact.whatsappNumber}`}
                  sx={linkSx}
                  aria-label={`Consultas al ${contact.phone}`}
                >
                  Consultas al: {contact.phone}
                </Link>
              </Box>
            </Box>
          </Box>
          <Box
            component="nav"
            aria-label="Legal"
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px 24px",
              alignContent: "start",
            }}
          >
            {legalLinks.map(({ href, text }) => (
              <Link key={href} component={NextLink} href={href} sx={linkSx}>
                {text}
              </Link>
            ))}
          </Box>
        </Wrap>
      </Box>
    </ThemeProvider>
  );
}
