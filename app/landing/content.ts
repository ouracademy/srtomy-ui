import type { SvgIconComponent } from "@mui/icons-material";
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutlined";
import PeopleOutline from "@mui/icons-material/PeopleOutlined";
import VerifiedUserOutlined from "@mui/icons-material/VerifiedUserOutlined";

export const brandName = "Oveja Fiel";

export const contact = {
  email: "info@sr-tommy.com",
  phone: "+51 941 475 889",
  whatsappNumber: "51941475889",
};

export const whatsappLink = (message?: string) => {
  const base = `https://wa.me/${contact.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};

export type Feature = Readonly<{
  title: string;
  description: string;
  Icon: SvgIconComponent;
  tone: "accent" | "light" | "dark";
}>;

export const features: readonly Feature[] = [
  {
    title: "Asistencia en minutos, desde el celular",
    description:
      "Abre el evento o el curso, marca a quienes llegaron y listo. Sin hojas de papel ni planillas que pasar en limpio después.",
    Icon: CheckCircleOutline,
    tone: "accent",
  },
  {
    title: "Registro de personas",
    description:
      "Un solo registro de miembros, visitas y líderes, con sus cargos y los grupos donde sirven.",
    Icon: PeopleOutline,
    tone: "light",
  },
  {
    title: "Sedes, grupos y ministerios",
    description:
      "Organiza la iglesia por niveles, sin límite de profundidad, y cambia de una sede a otra en un clic.",
    Icon: AccountTreeOutlined,
    tone: "light",
  },
  {
    title: "Eventos y cursos",
    description:
      "Crea tus actividades y compártelas con un enlace para que la gente se registre.",
    Icon: CalendarMonthOutlined,
    tone: "light",
  },
  {
    title: "Roles y permisos",
    description:
      "Cada líder ve y gestiona solo lo suyo. El acceso se hereda de arriba hacia abajo.",
    Icon: VerifiedUserOutlined,
    tone: "dark",
  },
];

export const steps = [
  {
    title: "Crea tu iglesia",
    description: "Regístrate y da de alta tu iglesia con su primera sede.",
  },
  {
    title: "Arma tu estructura",
    description: "Suma sedes, grupos y ministerios, y registra a las personas.",
  },
  {
    title: "Invita a tu equipo",
    description:
      "Envía una invitación por correo con el rol que cada líder necesita.",
  },
  {
    title: "Toma asistencia",
    description:
      "Crea el evento o curso y marca la asistencia desde el celular.",
  },
] as const;

export const roles = [
  {
    title: "Pastores y administradores",
    description:
      "Visión completa de la iglesia: sedes, equipos, personas y actividades en un solo panel.",
  },
  {
    title: "Líderes de grupo y ministerio",
    description:
      "Gestionan a su gente y toman asistencia, sin acceso a lo que no es suyo.",
  },
  {
    title: "Miembros",
    description:
      "Tienen su propio espacio para ver sus eventos y los grupos donde participan.",
  },
] as const;

export type Plan = Readonly<{
  name: string;
  tagline: string;
  /** What the big price says: "S/ 0", "S/ 45". */
  price: string;
  /** What goes after it: "al mes", and the price in Colombia. */
  priceNote: string;
  features: readonly string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}>;

// The four plans of the API (srtomy-api, `billing.<plan>.*`): the numbers here
// only tell the story. The plan screen of the portal («Plan y pagos») shows
// the same prices from the API and takes the payment. Prices include IGV in
// Peru and IVA in Colombia.
export const plans: readonly Plan[] = [
  {
    name: "Gratis",
    tagline: "Para iglesias que recién empiezan.",
    price: "S/ 0",
    priceNote: "siempre",
    features: [
      "Hasta 50 personas y 1 sede",
      "Grupos, ministerios, eventos y cursos",
      "Asistencia desde el celular con código QR",
      "Inscripciones y páginas públicas para compartir",
      "Asistente de IA: 20 mensajes al mes",
      "Roles predefinidos de acceso",
    ],
    cta: "Empezar gratis",
    href: "/portal",
  },
  {
    name: "Básico",
    tagline: "Para una iglesia de una sola sede.",
    price: "S/ 45",
    priceNote: "al mes · COP 49.000 en Colombia",
    features: [
      "Todo lo del plan Gratis",
      "Hasta 150 personas y 1 sede",
      "Asistente de IA: 150 mensajes al mes",
      "50 recordatorios por WhatsApp al mes",
      "Roles personalizados y exportar a Excel",
      "Número de WhatsApp propio como extra",
    ],
    cta: "Elegir Básico",
    href: "/portal",
  },
  {
    name: "Iglesia",
    tagline: "Para iglesias con varias sedes y equipos.",
    price: "S/ 75",
    priceNote: "al mes · COP 79.000 en Colombia",
    features: [
      "Todo lo del plan Básico",
      "Hasta 400 personas y 5 sedes",
      "Asistente de IA: 400 mensajes al mes",
      "200 recordatorios por WhatsApp al mes",
      "Correos a grupos, ofrendas, turnos y voluntarios, a medida que llegan",
      "Número de WhatsApp propio como extra",
    ],
    cta: "Elegir Iglesia",
    href: "/portal",
    highlighted: true,
  },
  {
    name: "Red",
    tagline: "Para redes de iglesias y sedes sin límite.",
    price: "S/ 149",
    priceNote: "al mes · COP 159.000 en Colombia",
    features: [
      "Todo lo del plan Iglesia",
      "Personas y sedes sin límite",
      "Asistente de IA: 1.200 mensajes al mes",
      "600 recordatorios por WhatsApp al mes",
      "Número de WhatsApp propio incluido",
    ],
    cta: "Elegir Red",
    href: "/portal",
  },
];

export const legalLinks = [
  { href: "/terms-conditions", text: "Términos y condiciones" },
  { href: "/privacy-policy", text: "Política de privacidad" },
  { href: "/complaints-book", text: "Libro de reclamaciones" },
] as const;
