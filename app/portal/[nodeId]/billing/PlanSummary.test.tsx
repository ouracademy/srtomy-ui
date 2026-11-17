import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { BillingResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { PlanSummary } from "./PlanSummary";

const now = new Date("2026-11-16T12:00:00Z");

const free: BillingResponse = {
  plan: "FREE",
  status: "FREE",
  people: 42,
  locations: 1,
  maxPeople: 50,
  maxLocations: 1,
  features: [
    { feature: "WHATSAPP", label: "WhatsApp de la iglesia", enabled: true },
    {
      feature: "FINANCES",
      label: "Ofrendas y estados de cuenta",
      enabled: false,
    },
  ],
  ai: { used: 12, limit: 30 },
};

afterEach(cleanup);

describe("PlanSummary", () => {
  it("shows the free plan with what is used of each maximum", () => {
    render(<PlanSummary billing={free} now={now} />);

    expect(screen.getByRole("heading", { name: "Plan Gratis" })).toBeVisible();
    expect(screen.getByText("Personas: 42 de 50 personas")).toBeVisible();
    expect(screen.getByText("Sedes: 1 de 1 sede")).toBeVisible();
    expect(
      screen.getByText("Mensajes del asistente este mes: 12 de 30 mensajes"),
    ).toBeVisible();
    expect(
      screen.getByRole("progressbar", { name: /Personas/ }),
    ).toHaveAttribute("aria-valuenow", "84");
  });

  it("lists what the plan includes and what is only of the church plan", () => {
    render(<PlanSummary billing={free} now={now} />);

    const features = within(
      screen.getByRole("list", { name: "Funciones del plan" }),
    ).getAllByRole("listitem");
    expect(features).toHaveLength(2);
    expect(features[0]).toHaveTextContent("WhatsApp de la iglesia");
    expect(features[1]).toHaveTextContent("Ofrendas y estados de cuenta");
    expect(features[1]).toHaveTextContent("Plan Iglesia");
  });

  it("counts the days left of the WhatsApp trial", () => {
    render(
      <PlanSummary
        billing={{
          ...free,
          whatsappTrialEndsAt: new Date("2026-11-21T12:00:00Z"),
        }}
        now={now}
      />,
    );

    expect(
      screen.getByText("Te quedan 5 días de prueba gratuita de WhatsApp."),
    ).toBeVisible();
  });

  it("says when the trial is over", () => {
    render(
      <PlanSummary
        billing={{
          ...free,
          whatsappTrialEndsAt: new Date("2026-11-01T12:00:00Z"),
        }}
        now={now}
      />,
    );

    expect(screen.getByText(/Terminó la prueba gratuita/)).toBeVisible();
  });

  it("shows the paid plan with its date and no maximum", () => {
    render(
      <PlanSummary
        billing={{
          ...free,
          plan: "CHURCH",
          status: "ACTIVE",
          paidUntil: "2026-12-15",
          maxPeople: undefined,
          maxLocations: undefined,
          people: 600,
        }}
        now={now}
      />,
    );

    expect(screen.getByRole("heading", { name: "Plan Iglesia" })).toBeVisible();
    expect(screen.getByText(/Pagado hasta el 15 de diciembre/)).toBeVisible();
    expect(
      screen.getByText("Personas: 600 personas (sin máximo)"),
    ).toBeVisible();
    expect(screen.queryByRole("progressbar", { name: /Personas/ })).toBeNull();
  });

  it.each([
    ["GRACE", /conservas todo unos días más/i],
    ["EXPIRED", /No se borró nada/],
  ] as const)("warns when the plan is %s", (status, text) => {
    render(
      <PlanSummary
        billing={{ ...free, status, paidUntil: "2026-11-01" }}
        now={now}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(text);
  });
});
