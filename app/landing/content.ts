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
  /** What the big price says: "S/ 0", "S/ 75". */
  price: string;
  /** What goes after it: "al mes", "al mes con 150 personas". */
  priceNote: string;
  features: readonly string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}>;

// The two plans of the API (srtomy-api, `billing.*`): the numbers here only
// tell the story, the plan screen of the portal («Plan y pagos») shows the
// real price for the people a church has and takes the payment.
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
      "Roles y accesos por sede, grupo y ministerio",
      "Asistente de IA: 30 mensajes al mes",
      "WhatsApp de la iglesia: prueba de 15 días",
    ],
    cta: "Empezar gratis",
    href: "/portal",
  },
  {
    name: "Iglesia",
    tagline: "Para iglesias que ya no caben en el plan Gratis.",
    price: "S/ 75",
    priceNote: "al mes con 150 personas · COP 85.000 en Colombia",
    features: [
      "Todo lo del plan Gratis, sin máximo de personas ni de sedes",
      "S/ 35 más al mes (COP 40.000) por cada 100 personas que sumes",
      "WhatsApp de la iglesia sin límite de tiempo",
      "Asistente de IA: 300 mensajes al mes y 100 más por cada 100 personas sobre 150",
      "Correos a grupos, ofrendas, turnos y exportar a Excel, a medida que llegan",
      "Pagas con tarjeta, Yape o PSE; un año cuesta 10 meses",
    ],
    cta: "Pasar al plan Iglesia",
    href: "/portal",
    highlighted: true,
  },
];

export type PriceCountry = "PE" | "CO";

// What each country pays: the base for `includedPeople`, and the extra for
// every `blockSize` people (or part of it) above. Same numbers as the API.
export const priceList = {
  includedPeople: 150,
  blockSize: 100,
  PE: { currency: "PEN", locale: "es-PE", base: 75, extraBlock: 35 },
  CO: { currency: "COP", locale: "es-CO", base: 85000, extraBlock: 40000 },
} as const;

export const monthlyPrice = (country: PriceCountry, people: number) => {
  const { includedPeople, blockSize } = priceList;
  const extraBlocks =
    people <= includedPeople
      ? 0
      : Math.ceil((people - includedPeople) / blockSize);
  const { base, extraBlock } = priceList[country];
  return base + extraBlock * extraBlocks;
};

export const formatMoney = (country: PriceCountry, amount: number) =>
  new Intl.NumberFormat(priceList[country].locale, {
    style: "currency",
    currency: priceList[country].currency,
    maximumFractionDigits: country === "CO" ? 0 : 2,
  }).format(amount);

export const legalLinks = [
  { href: "/terms-conditions", text: "Términos y condiciones" },
  { href: "/privacy-policy", text: "Política de privacidad" },
  { href: "/complaints-book", text: "Libro de reclamaciones" },
] as const;
