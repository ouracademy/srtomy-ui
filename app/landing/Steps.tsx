import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { steps } from "./content";
import { Section, SectionTitle } from "./Section";
import { landingColors } from "./theme";

export function Steps() {
  return (
    <Section bgcolor={landingColors.sand}>
      <SectionTitle>Empieza en cuatro pasos.</SectionTitle>
      <Box
        component="ol"
        sx={{
          listStyle: "none",
          m: 0,
          mt: 5,
          p: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 4,
        }}
      >
        {steps.map(({ title, description }, index) => (
          <Box
            component="li"
            key={title}
            sx={{
              borderTop: "2px solid",
              borderColor: "primary.main",
              pt: 2.5,
            }}
          >
            <Typography
              component="span"
              sx={{
                display: "block",
                fontSize: 56,
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              {String(index + 1).padStart(2, "0")}
            </Typography>
            <Typography
              component="h3"
              sx={{ mt: 2, fontSize: 22, fontWeight: 700 }}
            >
              {title}
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary" }}>
              {description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Section>
  );
}
