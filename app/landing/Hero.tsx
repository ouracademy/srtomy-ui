import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { LinkButton } from "./LinkButton";
import { ProductPreview } from "./ProductPreview";
import { Wrap } from "./Section";

export function Hero() {
  return (
    <Box
      component="section"
      sx={{ pt: "clamp(40px,7vw,96px)", pb: "clamp(32px,5vw,64px)" }}
    >
      <Wrap>
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.25,
            px: 1.75,
            py: 0.75,
            border: "1px solid",
            borderColor: "primary.main",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <Box
            component="span"
            aria-hidden="true"
            sx={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              bgcolor: "secondary.main",
              border: "1px solid",
              borderColor: "primary.main",
            }}
          />
          Software para iglesias
        </Box>
        <Typography
          variant="h1"
          sx={{
            mt: 3,
            maxWidth: 1040,
            fontSize: "clamp(40px,7.4vw,96px)",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.04em",
          }}
        >
          Administra tu iglesia en{" "}
          <Box
            component="span"
            sx={(theme) => ({
              boxShadow: `inset 0 -0.2em 0 ${theme.palette.secondary.main}`,
            })}
          >
            un solo lugar
          </Box>
          .
        </Typography>
        <Typography
          sx={{
            mt: 3.5,
            maxWidth: 640,
            fontSize: "clamp(18px,2vw,22px)",
            color: "text.secondary",
          }}
        >
          Registro de personas, sedes, grupos y ministerios, y eventos y cursos
          con asistencia en minutos desde el celular.
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, mt: 4 }}>
          <LinkButton
            href="/portal"
            size="large"
            variant="contained"
            color="secondary"
            sx={{ border: "1px solid", borderColor: "primary.main" }}
          >
            Empezar gratis
          </LinkButton>
          <LinkButton
            href="#precios"
            size="large"
            variant="outlined"
            color="primary"
            sx={{ fontWeight: 500 }}
          >
            Ver precios
          </LinkButton>
        </Box>
        <Typography sx={{ mt: 2, fontSize: 14, color: "text.secondary" }}>
          Funciona en el navegador de tu celular o tu computadora. No instalas
          nada.
        </Typography>
        <ProductPreview />
      </Wrap>
    </Box>
  );
}
