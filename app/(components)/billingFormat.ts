import type {
  BillingResponse,
  BillingResponseStatus,
  InvoiceResponseStatus,
  PlanResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";

// Pure helpers of the plan screens: texts in Spanish and the numbers behind the
// bars and the warnings. Nothing here calls the API.

// When a plan with a maximum shows a warning: at 80 % of it.
export const WARNING_RATIO = 0.8;

export const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat(currency === "COP" ? "es-CO" : "es-PE", {
    style: "currency",
    currency,
    // Pesos have no cents in practice; soles do.
    maximumFractionDigits: currency === "COP" ? 0 : 2,
  }).format(amount);

export const countryLabels: Record<string, string> = {
  PE: "Perú (soles)",
  CO: "Colombia (pesos)",
};

export const statusLabels: Record<BillingResponseStatus, string> = {
  FREE: "Sin pagar",
  ACTIVE: "Activo",
  GRACE: "Vencido, en gracia",
  EXPIRED: "Vencido",
};

export const invoiceStatusLabels: Record<InvoiceResponseStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
  EXPIRED: "Vencido",
};

// How a plan is called when the API has not said (it sends the label of every
// plan in `plans`).
export const planNames: Record<string, string> = {
  FREE: "Gratis",
  BASIC: "Básico",
  CHURCH: "Iglesia",
  NETWORK: "Red",
};

export const planName = (plan: string | undefined) =>
  plan ? (planNames[plan] ?? plan) : "";

// A date-only value ("2026-12-15") shown as the church reads it. It is parsed
// by hand: `new Date("2026-12-15")` would be UTC midnight, the day before in
// Lima or Bogotá.
export const formatDay = (value: string | undefined) => {
  const parts = value?.split("-").map(Number);
  const [year, month, day] = parts ?? [];
  if (!year || !month || !day) return "";
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "long" }).format(
    new Date(year, month - 1, day),
  );
};

// How much of a maximum is used, from 0 to 1; null when there is no maximum.
export const usageRatio = (
  used: number | undefined,
  max: number | undefined,
) => (max ? Math.min(1, (used ?? 0) / max) : null);

export const isNearLimit = (
  used: number | undefined,
  max: number | undefined,
) => (usageRatio(used, max) ?? 0) >= WARNING_RATIO;

export const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

// The price list of one country of a plan, or undefined when it is not charged
// there (the free plan has no prices).
export const priceOf = (plan: PlanResponse | undefined, country: string) =>
  plan?.prices?.find((price) => price.country === country);

// The plan in force, as the plans list of the API describes it.
export const currentPlan = (billing: BillingResponse) =>
  billing.plans?.find((plan) => plan.plan === billing.plan);

// The plan a church moves to when this one is not enough; undefined after the
// last. The list of the API is in the order of the prices.
export const nextPlan = (billing: BillingResponse) => {
  const plans = billing.plans ?? [];
  const index = plans.findIndex((plan) => plan.plan === billing.plan);
  return index >= 0 ? plans[index + 1] : undefined;
};

// What a month (or a year) of a plan costs in a country, the extra number
// included when asked. Null when the plan is not charged there.
export const planTotal = (
  plan: PlanResponse,
  country: string,
  months: 1 | 12,
  ownNumber: boolean,
) => {
  const price = priceOf(plan, country);
  if (!price) return null;
  const base = months === 12 ? price.yearly : price.monthly;
  const extra = months === 12 ? price.ownNumberYearly : price.ownNumberMonthly;
  return (base ?? 0) + (ownNumber ? (extra ?? 0) : 0);
};

// The plan the screen suggests: the one in force while it is paid, otherwise
// the cheapest paid plan the church fits in.
export const suggestedPlan = (billing: BillingResponse) => {
  const paid = (billing.plans ?? []).filter((plan) => plan.plan !== "FREE");
  const current = paid.find((plan) => plan.plan === billing.plan);
  return current ?? paid.find((plan) => plan.fits) ?? paid.at(-1);
};
