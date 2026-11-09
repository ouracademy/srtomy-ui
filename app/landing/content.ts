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
  /** Monthly price in soles. */
  price: number;
  features: readonly string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}>;

// Paid plans are not self-service yet (billing is not connected), so their
// buttons open a WhatsApp chat with the plan already named.
const planInterest = (name: string) =>
  whatsappLink(`Hola, quiero el plan ${name} de ${brandName}`);

export const plans: readonly Plan[] = [
  {
    name: "Semilla",
    tagline: "Para iglesias que recién empiezan.",
    price: 0,
    features: [
      "Hasta 50 personas",
      "1 sede",
      "Eventos y cursos con asistencia desde el celular",
      "Enlace público para compartir tus eventos",
      "Soporte por correo",
    ],
    cta: "Empezar gratis",
    href: "/portal",
  },
  {
    name: "Crecimiento",
    tagline: "Para iglesias con varios equipos y líderes.",
    price: 69,
    features: [
      "Todo lo de Semilla",
      "Hasta 250 personas",
      "Hasta 3 sedes",
      "Grupos y ministerios sin límite",
      "Roles y permisos heredados",
      "Invitaciones por correo para tu equipo",
    ],
    cta: "Elegir Crecimiento",
    href: planInterest("Crecimiento"),
    highlighted: true,
  },
  {
    name: "Red",
    tagline: "Para iglesias con varias sedes.",
    price: 149,
    features: [
      "Todo lo de Crecimiento",
      "Personas ilimitadas",
      "Sedes ilimitadas",
      "Visibilidad configurable por sede, grupo y ministerio",
      "Soporte prioritario por WhatsApp",
    ],
    cta: "Elegir Red",
    href: planInterest("Red"),
  },
];

export const formatPrice = (price: number) => `S/ ${price}`;

export const legalLinks = [
  { href: "/terms-conditions", text: "Términos y condiciones" },
  { href: "/privacy-policy", text: "Política de privacidad" },
  { href: "/complaints-book", text: "Libro de reclamaciones" },
] as const;
