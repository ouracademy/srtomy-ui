// Public origin used for canonical URLs, sitemap and social previews.
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://srtommy-ui-test.vercel.app"
).replace(/\/$/, "");

export const siteName = "Oveja fiel";

// Brand blue (see buttonStyles.ts); tints the browser UI and the installed app.
export const themeColor = "#2563EB";

export const siteTitle =
  "Oveja fiel | Software para iglesias y toma de asistencia";

export const siteDescription =
  "Administra tu iglesia en un solo lugar: registro de personas, sedes, grupos y ministerios, eventos y cursos con asistencia en minutos desde el celular. Prueba Oveja fiel.";

export const siteKeywords = [
  "software para iglesias",
  "sistema de gestión de iglesias",
  "app para iglesias",
  "control de asistencia iglesia",
  "registro de miembros",
  "administración de iglesias",
  "grupos pequeños",
  "ministerios",
  "eventos de iglesia",
];
