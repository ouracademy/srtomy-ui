import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { CheckBadge } from "./CheckBadge";
import { landingColors } from "./theme";

// Sample people for the illustration; they are not real data.
const attendees = [
  { initials: "AR", name: "Ana Rojas", present: true },
  { initials: "LP", name: "Luis Paredes", present: true },
  { initials: "CV", name: "Carmen Vega", present: false },
  { initials: "JS", name: "Jorge Salas", present: true },
] as const;

const organization = [
  { label: "Iglesia", kind: "Raíz", depth: 0 },
  { label: "Sede Central", kind: "Sede", depth: 1 },
  { label: "Jóvenes", kind: "Grupo", depth: 2 },
  { label: "Alabanza", kind: "Ministerio", depth: 2 },
  { label: "Sede Norte", kind: "Sede", depth: 1 },
] as const;

const panelSx = {
  flex: "1 1 340px",
  minWidth: 0,
  bgcolor: landingColors.inkSurface,
  borderRadius: "20px",
  p: 2.5,
} as const;

const rowSx = {
  display: "flex",
  alignItems: "center",
  gap: 1.5,
  px: 1.5,
  py: 1.25,
  borderRadius: "14px",
  bgcolor: landingColors.inkRaised,
} as const;

function AttendancePanel() {
  return (
    <Box sx={panelSx}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
          Asistencia · Culto de domingo
        </Typography>
        <Box
          component="span"
          sx={{
            px: 1.5,
            py: 0.5,
            borderRadius: 999,
            bgcolor: landingColors.inkTag,
            color: landingColors.inkMuted,
            fontSize: 13,
          }}
        >
          Sede Central
        </Box>
      </Box>
      <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        {attendees.map(({ initials, name, present }) => (
          <Box key={initials} sx={rowSx}>
            <Box
              component="span"
              sx={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                bgcolor: landingColors.inkAvatar,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {initials}
            </Box>
            <Box component="span" sx={{ flex: 1 }}>
              {name}
            </Box>
            {present ? (
              <CheckBadge size={28} />
            ) : (
              <Box
                component="span"
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  border: `2px solid ${landingColors.inkRing}`,
                }}
              />
            )}
          </Box>
        ))}
      </Box>
      <Typography sx={{ mt: 2, color: landingColors.inkMuted, fontSize: 14 }}>
        Toca a cada persona para marcar su llegada.
      </Typography>
    </Box>
  );
}

function OrganizationPanel() {
  return (
    <Box sx={panelSx}>
      <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Mi iglesia</Typography>
      <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 1 }}>
        {organization.map(({ label, kind, depth }) => (
          <Box
            key={label}
            sx={{
              ...rowSx,
              gap: 1.25,
              ml: `${depth * 20}px`,
              ...(depth === 0 && {
                bgcolor: "secondary.main",
                color: "secondary.contrastText",
                fontWeight: 700,
              }),
            }}
          >
            {label}
            <Box
              component="span"
              sx={{
                ml: "auto",
                fontSize: 13,
                fontWeight: depth === 0 ? 500 : 400,
                color: depth === 0 ? "inherit" : landingColors.inkMuted,
              }}
            >
              {kind}
            </Box>
          </Box>
        ))}
      </Box>
      <Typography sx={{ mt: 2, color: landingColors.inkMuted, fontSize: 14 }}>
        Sedes, grupos y ministerios, tantos niveles como necesites.
      </Typography>
    </Box>
  );
}

// Decorative picture of the product: hidden from assistive technology.
export function ProductPreview() {
  return (
    <Box
      aria-hidden="true"
      sx={{
        mt: "clamp(40px,6vw,72px)",
        bgcolor: "primary.main",
        color: "primary.contrastText",
        borderRadius: "28px",
        p: "clamp(16px,3vw,32px)",
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
      }}
    >
      <AttendancePanel />
      <OrganizationPanel />
    </Box>
  );
}
