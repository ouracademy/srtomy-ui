import type {
  BillingResponse,
  PlanResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";

const price = (
  country: "PE" | "CO",
  monthly: number,
  yearly: number,
  own: number,
) => ({
  country,
  currency: country === "PE" ? "PEN" : "COP",
  monthly,
  yearly,
  ownNumberMonthly: own,
  ownNumberYearly: own * 10,
});

const plan = (overrides: PlanResponse): PlanResponse => ({
  fits: true,
  prices: [],
  ...overrides,
});

export const plans: PlanResponse[] = [
  plan({
    plan: "FREE",
    label: "Gratis",
    maxPeople: 50,
    maxLocations: 1,
    aiMessages: 20,
  }),
  plan({
    plan: "BASIC",
    label: "Básico",
    maxPeople: 150,
    maxLocations: 1,
    aiMessages: 150,
    ownNumberExtra: true,
    prices: [price("PE", 45, 450, 49), price("CO", 49000, 490000, 49000)],
  }),
  plan({
    plan: "CHURCH",
    label: "Iglesia",
    maxPeople: 400,
    maxLocations: 5,
    aiMessages: 400,
    ownNumberExtra: true,
    prices: [price("PE", 75, 750, 49), price("CO", 79000, 790000, 49000)],
  }),
  plan({
    plan: "NETWORK",
    label: "Red",
    aiMessages: 1200,
    ownNumberIncluded: true,
    prices: [price("PE", 149, 1490, 49), price("CO", 159000, 1590000, 49000)],
  }),
];

export const freeBilling: BillingResponse = {
  plan: "FREE",
  status: "FREE",
  people: 42,
  locations: 1,
  maxPeople: 50,
  maxLocations: 1,
  ownNumber: false,
  features: [
    { feature: "EXCEL_EXPORT", label: "Exportar a Excel", enabled: false },
    {
      feature: "FINANCES",
      label: "Ofrendas y estados de cuenta",
      enabled: false,
    },
  ],
  plans,
  ai: { used: 12, limit: 20 },
  reminders: { used: 0, limit: 0 },
};
