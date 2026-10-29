import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import WhatsApp from "@mui/icons-material/WhatsApp";
import { brandName, contact, whatsappLink } from "./content";
import { LinkButton } from "./LinkButton";
import { Section } from "./Section";
import { landingColors } from "./theme";

export function FinalCta() {
  return (
    <Section id="contacto">
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          borderRadius: "36px",
          p: "clamp(28px,6vw,80px)",
        }}
      >
        <Typography
          component="h2"
          sx={{
            maxWidth: 820,
            fontSize: "clamp(34px,5.4vw,68px)",
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: "-0.035em",
          }}
        >
          Prueba {brandName} con tu iglesia.
        </Typography>
        <Typography
          sx={{
            mt: 2.5,
            maxWidth: 560,
            fontSize: 18,
            color: landingColors.inkMuted,
          }}
        >
          Crea tu iglesia gratis y empieza a tomar asistencia hoy mismo.
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 4 }}>
          <LinkButton
            href="/portal"
            size="large"
            variant="contained"
            color="secondary"
          >
            Empezar gratis
          </LinkButton>
          <LinkButton
            href={whatsappLink()}
            size="large"
            variant="outlined"
            startIcon={<WhatsApp />}
            sx={{
              color: "primary.contrastText",
              borderColor: "primary.contrastText",
              fontWeight: 500,
            }}
          >
            Escríbenos por WhatsApp
          </LinkButton>
        </Box>
        <Typography
          sx={{ mt: 3.5, fontSize: 15, color: landingColors.inkMuted }}
        >
          <Link href={`mailto:${contact.email}`} color="inherit">
            {contact.email}
          </Link>
          {" · Consultas al "}
          <Link href={`tel:+${contact.whatsappNumber}`} color="inherit">
            {contact.phone}
          </Link>
        </Typography>
      </Box>
    </Section>
  );
}
