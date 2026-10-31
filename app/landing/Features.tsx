import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { features, type Feature } from "./content";
import { Section, SectionTitle } from "./Section";
import { landingColors } from "./theme";

const toneStyles = {
  accent: {
    card: {
      bgcolor: "secondary.main",
      border: "1px solid",
      borderColor: "primary.main",
    },
    badge: { bgcolor: "primary.main", color: "primary.contrastText" },
    body: landingColors.saffronText,
  },
  light: {
    card: {
      bgcolor: "background.paper",
      border: "1px solid",
      borderColor: "divider",
    },
    badge: { bgcolor: "primary.main", color: "primary.contrastText" },
    body: "text.secondary",
  },
  dark: {
    card: { bgcolor: "primary.main", color: "primary.contrastText" },
    badge: { bgcolor: "secondary.main", color: "secondary.contrastText" },
    body: landingColors.inkMuted,
  },
} as const;

function FeatureCard({
  feature,
  grow = "1 1 280px",
}: Readonly<{ feature: Feature; grow?: string }>) {
  const { title, description, Icon, tone } = feature;
  const styles = toneStyles[tone];
  const featured = tone === "accent";
  return (
    <Box
      component="article"
      sx={{
        flex: grow,
        minWidth: 0,
        borderRadius: "28px",
        p: featured ? "clamp(24px,3vw,40px)" : "clamp(24px,3vw,32px)",
        ...styles.card,
      }}
    >
      <Box
        sx={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...styles.badge,
        }}
      >
        <Icon aria-hidden="true" sx={{ fontSize: 28 }} />
      </Box>
      <Typography
        component="h3"
        sx={{
          mt: 3,
          fontWeight: featured ? 900 : 700,
          fontSize: featured ? "clamp(26px,3vw,36px)" : 24,
          lineHeight: featured ? 1.1 : 1.3,
          letterSpacing: featured ? "-0.02em" : "-0.01em",
        }}
      >
        {title}
      </Typography>
      <Typography
        sx={{
          mt: featured ? 1.5 : 1,
          maxWidth: featured ? 520 : undefined,
          fontSize: featured ? 18 : undefined,
          color: styles.body,
        }}
      >
        {description}
      </Typography>
    </Box>
  );
}

export function Features() {
  const [featured, ...others] = features;
  const firstRow = others.slice(0, 1);
  const secondRow = others.slice(1);
  return (
    <Section id="funciones">
      <SectionTitle>Todo lo que tu iglesia necesita, conectado.</SectionTitle>
      <Box sx={{ mt: 5, display: "flex", flexWrap: "wrap", gap: 2 }}>
        {featured && <FeatureCard feature={featured} grow="2 1 520px" />}
        {firstRow.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </Box>
      <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", gap: 2 }}>
        {secondRow.map((feature) => (
          <FeatureCard key={feature.title} feature={feature} />
        ))}
      </Box>
    </Section>
  );
}
