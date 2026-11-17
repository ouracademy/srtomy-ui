import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PlanUsageNotice } from "./PlanUsageNotice";

const state = vi.hoisted(() => ({
  billing: undefined as unknown,
  permissions: new Set<string>(),
}));

vi.mock("@/app/(api)/generated", () => ({
  useGetOrganizationsByIdBilling: () => ({ data: state.billing }),
}));
vi.mock("@/app/(hooks)/usePermissions", () => ({
  usePermissions: () => ({ can: (p: string) => state.permissions.has(p) }),
}));

const now = new Date("2026-11-16T12:00:00Z");

beforeEach(() => {
  state.billing = { plan: "FREE", people: 10, maxPeople: 50 };
  state.permissions = new Set();
});
afterEach(cleanup);

describe("PlanUsageNotice for people", () => {
  it("says nothing while the church is far from the maximum", () => {
    render(<PlanUsageNotice nodeId="n1" kind="people" now={now} />);

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("warns at 80 % of the maximum", () => {
    state.billing = { plan: "FREE", people: 40, maxPeople: 50 };

    render(<PlanUsageNotice nodeId="n1" kind="people" now={now} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Tu iglesia usa 40 de 50 personas del plan Gratis.",
    );
  });

  it("says no more can be added at the maximum", () => {
    state.billing = { plan: "FREE", people: 50, maxPeople: 50 };

    render(<PlanUsageNotice nodeId="n1" kind="people" now={now} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "llegó al máximo de 50 personas",
    );
  });

  it("offers the plans only to whoever can pay them", () => {
    state.billing = { plan: "FREE", people: 45, maxPeople: 50 };
    const { rerender } = render(
      <PlanUsageNotice nodeId="n1" kind="people" now={now} />,
    );
    expect(screen.queryByRole("link", { name: "Ver planes" })).toBeNull();

    state.permissions = new Set(["billing.manage"]);
    rerender(<PlanUsageNotice nodeId="n1" kind="people" now={now} />);

    expect(screen.getByRole("link", { name: "Ver planes" })).toHaveAttribute(
      "href",
      "/portal/n1/billing",
    );
  });

  it("says nothing on the paid plan or while the plan is unknown", () => {
    state.billing = { plan: "CHURCH", people: 900 };
    const { rerender } = render(
      <PlanUsageNotice nodeId="n1" kind="people" now={now} />,
    );
    expect(screen.queryByRole("alert")).toBeNull();

    state.billing = undefined;
    rerender(<PlanUsageNotice nodeId="n1" kind="people" now={now} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("PlanUsageNotice for WhatsApp", () => {
  it("counts the days left of the trial", () => {
    state.billing = {
      plan: "FREE",
      whatsappTrialEndsAt: new Date("2026-11-19T12:00:00Z"),
    };

    render(<PlanUsageNotice nodeId="n1" kind="whatsapp" now={now} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Te quedan 3 días de prueba gratuita de WhatsApp.",
    );
  });

  it("says the trial is over", () => {
    state.billing = {
      plan: "FREE",
      whatsappTrialEndsAt: new Date("2026-11-01T12:00:00Z"),
    };

    render(<PlanUsageNotice nodeId="n1" kind="whatsapp" now={now} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Terminó la prueba gratuita",
    );
  });

  it("says nothing when the trial never started or the plan is paid", () => {
    state.billing = { plan: "FREE" };
    const { rerender } = render(
      <PlanUsageNotice nodeId="n1" kind="whatsapp" now={now} />,
    );
    expect(screen.queryByRole("alert")).toBeNull();

    state.billing = {
      plan: "CHURCH",
      whatsappTrialEndsAt: new Date("2026-11-19T12:00:00Z"),
    };
    rerender(<PlanUsageNotice nodeId="n1" kind="whatsapp" now={now} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
