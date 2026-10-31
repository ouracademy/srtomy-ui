import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { roles } from "./content";
import { Section, SectionTitle } from "./Section";

export function Roles() {
  return (
    <Section>
      <SectionTitle>Cada persona ve lo que le corresponde.</SectionTitle>
      <Box
        sx={{
          mt: 5,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 2,
        }}
      >
        {roles.map(({ title, description }) => (
          <Box
            component="article"
            key={title}
            sx={{
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: "28px",
              p: "clamp(24px,3vw,32px)",
            }}
          >
            <Typography component="h3" sx={{ fontSize: 24, fontWeight: 700 }}>
              {title}
            </Typography>
            <Typography sx={{ mt: 1.5, color: "text.secondary" }}>
              {description}
            </Typography>
          </Box>
        ))}
      </Box>
    </Section>
  );
}
