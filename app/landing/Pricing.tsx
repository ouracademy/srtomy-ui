import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { CheckBadge } from "./CheckBadge";
import { contact, formatPrice, plans, type Plan } from "./content";
import { LinkButton } from "./LinkButton";
import { Section, SectionTitle } from "./Section";
import { landingColors } from "./theme";

function PlanCard({ plan }: Readonly<{ plan: Plan }>) {
  const { name, tagline, price, features, cta, href, highlighted } = plan;
  const mutedColor = highlighted ? landingColors.inkMuted : "text.secondary";
  return (
    <Box
      component="article"
      sx={{
        display: "flex",
        flexDirection: "column",
        borderRadius: "28px",
        p: "clamp(24px,3vw,32px)",
        ...(highlighted
          ? { bgcolor: "primary.main", color: "primary.contrastText" }
          : {
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
            }),
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography component="h3" sx={{ fontSize: 24, fontWeight: 700 }}>
          {name}
        </Typography>
        {highlighted && (
          <Box
            component="span"
            sx={{
              px: 1.5,
              py: 0.5,
              borderRadius: 999,
              bgcolor: "secondary.main",
              color: "secondary.contrastText",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Recomendado
          </Box>
        )}
      </Box>
      <Typography sx={{ mt: 1, color: mutedColor }}>{tagline}</Typography>
      <Box sx={{ mt: 3, display: "flex", alignItems: "baseline", gap: 0.75 }}>
        <Typography
          component="span"
          sx={{
            fontSize: "clamp(44px,5vw,56px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1,
          }}
        >
          {formatPrice(price)}
        </Typography>
        <Typography component="span" sx={{ color: mutedColor }}>
          al mes
        </Typography>
      </Box>
      <Box
        component="ul"
        sx={{
          listStyle: "none",
          m: 0,
          mt: 3,
          p: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {features.map((feature) => (
          <Box
            component="li"
            key={feature}
            sx={{ display: "flex", gap: 1.25, alignItems: "flex-start" }}
          >
            <Box sx={{ mt: "1px" }}>
              <CheckBadge size={22} />
            </Box>
            {feature}
          </Box>
        ))}
      </Box>
      <LinkButton
        href={href}
        size="large"
        variant={highlighted ? "contained" : "outlined"}
        color={highlighted ? "secondary" : "primary"}
        sx={{ mt: 3.5 }}
      >
        {cta}
      </LinkButton>
    </Box>
  );
}

export function Pricing() {
  return (
    <Section id="precios" bgcolor={landingColors.sand}>
      <SectionTitle>
        Empieza gratis. Paga cuando tu iglesia crezca.
      </SectionTitle>
      <Typography
        sx={{ mt: 2.5, maxWidth: 620, fontSize: 18, color: "text.secondary" }}
      >
        Tres planes por iglesia, en soles. Sin cobros por instalación y con 2
        meses gratis si pagas al año.
      </Typography>
      <Box
        sx={{
          mt: 5,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
          gap: 2,
          alignItems: "stretch",
        }}
      >
        {plans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </Box>
      <Typography sx={{ mt: 3, fontSize: 15, color: "text.secondary" }}>
        ¿Necesitas algo distinto? Escríbenos a{" "}
        <Link href={`mailto:${contact.email}`} color="inherit">
          {contact.email}
        </Link>{" "}
        y armamos un plan a tu medida.
      </Typography>
    </Section>
  );
}
