import type {
  BillingResponse,
  BillingResponseStatus,
  InvoiceResponseStatus,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";

// Pure helpers of the plan screen: texts in Spanish and the numbers behind the
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
  FREE: "Plan Gratis",
  ACTIVE: "Plan Iglesia activo",
  GRACE: "Plan Iglesia vencido, en gracia",
  EXPIRED: "Plan Iglesia vencido",
};

export const invoiceStatusLabels: Record<InvoiceResponseStatus, string> = {
  PENDING: "Pendiente",
  PAID: "Pagado",
  REJECTED: "Rechazado",
  CANCELLED: "Cancelado",
  EXPIRED: "Vencido",
};

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

// Whole days left until `end`, never below zero; null without a trial.
export const daysLeft = (end: Date | undefined, now: Date) =>
  end
    ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86_400_000))
    : null;

// The free plan's WhatsApp trial: running, over, or never started.
export const whatsappTrial = (
  billing: Pick<BillingResponse, "plan" | "whatsappTrialEndsAt">,
  now: Date,
) => {
  if (billing.plan === "CHURCH" || !billing.whatsappTrialEndsAt) return null;
  const left = daysLeft(billing.whatsappTrialEndsAt, now);
  return left === null ? null : { daysLeft: left, over: left === 0 };
};

export const plural = (count: number, one: string, many: string) =>
  `${count} ${count === 1 ? one : many}`;

// The price list of one country, or undefined when we do not charge there.
export const priceOf = (billing: BillingResponse, country: string) =>
  billing.prices?.find((price) => price.country === country);
