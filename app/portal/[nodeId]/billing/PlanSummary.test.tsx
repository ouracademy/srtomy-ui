import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { freeBilling } from "./billingFixtures";
import { PlanSummary } from "./PlanSummary";

afterEach(cleanup);

describe("PlanSummary", () => {
  it("shows the free plan with what is used of each maximum", () => {
    render(<PlanSummary billing={freeBilling} />);

    expect(screen.getByRole("heading", { name: "Plan Gratis" })).toBeVisible();
    expect(screen.getByText("Personas: 42 de 50 personas")).toBeVisible();
    expect(screen.getByText("Sedes: 1 de 1 sede")).toBeVisible();
    expect(
      screen.getByText("Mensajes del asistente este mes: 12 de 20 mensajes"),
    ).toBeVisible();
    expect(
      screen.getByRole("progressbar", { name: /Personas/ }),
    ).toHaveAttribute("aria-valuenow", "84");
  });

  it("shows the reminders of the month against the plan", () => {
    render(
      <PlanSummary
        billing={{
          ...freeBilling,
          plan: "BASIC",
          reminders: { used: 10, limit: 50 },
        }}
      />,
    );

    expect(
      screen.getByText(
        "Recordatorios por WhatsApp este mes: 10 de 50 recordatorios",
      ),
    ).toBeVisible();
  });

  it("lists what the plan includes and what needs a higher plan", () => {
    render(
      <PlanSummary
        billing={{
          ...freeBilling,
          features: [
            {
              feature: "EXCEL_EXPORT",
              label: "Exportar a Excel",
              enabled: true,
            },
            { feature: "FINANCES", label: "Ofrendas", enabled: false },
          ],
        }}
      />,
    );

    const features = within(
      screen.getByRole("list", { name: "Funciones del plan" }),
    ).getAllByRole("listitem");
    expect(features).toHaveLength(2);
    expect(features[0]).toHaveTextContent("Exportar a Excel");
    expect(features[0]).not.toHaveTextContent("plan superior");
    expect(features[1]).toHaveTextContent("Ofrendas");
    expect(features[1]).toHaveTextContent("En un plan superior");
  });

  it("says where WhatsApp goes out from and which plan comes next", () => {
    render(<PlanSummary billing={freeBilling} />);

    expect(
      screen.getByText(/WhatsApp sale por el número de Sr. Tommy/),
    ).toBeVisible();
    expect(screen.getByText("El siguiente plan es el Básico.")).toBeVisible();
  });

  it("says the church uses its own number when it has one", () => {
    render(
      <PlanSummary
        billing={{ ...freeBilling, plan: "NETWORK", ownNumber: true }}
      />,
    );

    expect(
      screen.getByText("Tu iglesia usa su propio número de WhatsApp."),
    ).toBeVisible();
    expect(screen.queryByText(/siguiente plan/)).toBeNull();
  });

  it("shows a paid plan with its date and no maximum", () => {
    render(
      <PlanSummary
        billing={{
          ...freeBilling,
          plan: "NETWORK",
          status: "ACTIVE",
          paidUntil: "2026-12-15",
          maxPeople: undefined,
          maxLocations: undefined,
          people: 600,
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Plan Red" })).toBeVisible();
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
        billing={{
          ...freeBilling,
          plan: "CHURCH",
          status,
          paidUntil: "2026-11-01",
        }}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent(text);
  });
});
