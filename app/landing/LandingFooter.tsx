import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import NextLink from "next/link";
import { brandName, legalLinks } from "./content";
import { Wrap } from "./Section";

export function LandingFooter() {
  return (
    <Box
      component="footer"
      sx={{ borderTop: "1px solid", borderColor: "divider", pt: 3.5, pb: 5 }}
    >
      <Wrap
        sx={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "16px 32px",
          fontSize: 14,
          color: "text.secondary",
        }}
      >
        <span>© {brandName}</span>
        <Box
          component="nav"
          aria-label="Legal"
          sx={{ display: "flex", flexWrap: "wrap", gap: "8px 24px" }}
        >
          {legalLinks.map(({ href, text }) => (
            <Link
              key={href}
              component={NextLink}
              href={href}
              color="inherit"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 24,
              }}
            >
              {text}
            </Link>
          ))}
        </Box>
      </Wrap>
    </Box>
  );
}
