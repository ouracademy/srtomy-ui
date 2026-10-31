import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export const sectionPadding = "clamp(40px,6vw,88px)";

type WrapProps = Readonly<{ children: ReactNode; sx?: SxProps<Theme> }>;

// Centered column with the same responsive side gutter in every section.
export function Wrap({ children, sx }: WrapProps) {
  return (
    <Container
      maxWidth="lg"
      disableGutters
      sx={[{ px: "clamp(16px,4vw,48px)" }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      {children}
    </Container>
  );
}

type SectionProps = Readonly<{
  id?: string;
  bgcolor?: string;
  children: ReactNode;
}>;

export function Section({ id, bgcolor, children }: SectionProps) {
  return (
    <Box
      component="section"
      id={id}
      sx={{ py: sectionPadding, bgcolor: bgcolor ?? "transparent" }}
    >
      <Wrap>{children}</Wrap>
    </Box>
  );
}

export function SectionTitle({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Typography
      component="h2"
      sx={{
        maxWidth: 760,
        fontSize: "clamp(32px,4.6vw,56px)",
        fontWeight: 900,
        lineHeight: 1.05,
        letterSpacing: "-0.03em",
      }}
    >
      {children}
    </Typography>
  );
}
