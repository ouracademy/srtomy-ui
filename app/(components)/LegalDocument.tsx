import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Wrap } from "../landing/Section";

export type LegalSection = Readonly<{
  title: string;
  paragraphs: readonly string[];
}>;

export type LegalContent = Readonly<{
  title: string;
  intro?: readonly string[];
  sections: readonly LegalSection[];
}>;

// A long-form legal text: one h1, one h2 per clause. The text lives in a
// `content.ts` beside each page, so it can be edited without touching markup.
export function LegalDocument({ title, intro = [], sections }: LegalContent) {
  return (
    <Wrap sx={{ py: "clamp(24px,5vw,64px)", maxWidth: 800 }}>
      <Typography
        component="h1"
        sx={{
          fontSize: "clamp(32px,4.6vw,48px)",
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: "-0.03em",
          mb: 3,
        }}
      >
        {title}
      </Typography>
      <Box sx={{ display: "grid", gap: 4 }}>
        {intro.length > 0 && (
          <Box sx={{ display: "grid", gap: 1.5 }}>
            {intro.map((text) => (
              <Typography key={text}>{text}</Typography>
            ))}
          </Box>
        )}
        {sections.map((section) => (
          <Box
            component="section"
            key={section.title}
            sx={{ display: "grid", gap: 1.5 }}
          >
            <Typography
              component="h2"
              sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.3 }}
            >
              {section.title}
            </Typography>
            {section.paragraphs.map((text) => (
              <Typography key={text}>{text}</Typography>
            ))}
          </Box>
        ))}
      </Box>
    </Wrap>
  );
}
