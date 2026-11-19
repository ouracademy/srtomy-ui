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

const plans = ["FREE", "BASIC", "CHURCH", "NETWORK"].map((plan) => ({ plan }));

beforeEach(() => {
  state.billing = { plan: "FREE", plans, people: 10, maxPeople: 50 };
  state.permissions = new Set();
});
afterEach(cleanup);

describe("PlanUsageNotice for people", () => {
  it("says nothing while the church is far from the maximum", () => {
    render(<PlanUsageNotice nodeId="n1" kind="people" />);

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("warns at 80 % of the maximum of the plan", () => {
    state.billing = { plan: "FREE", plans, people: 40, maxPeople: 50 };

    render(<PlanUsageNotice nodeId="n1" kind="people" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Tu iglesia usa 40 de 50 personas del plan Gratis.",
    );
  });

  it("uses the maximum of any plan, not only the free one", () => {
    state.billing = { plan: "BASIC", plans, people: 125, maxPeople: 150 };

    render(<PlanUsageNotice nodeId="n1" kind="people" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "125 de 150 personas del plan Básico",
    );
  });

  it("says no more can be added at the maximum and names the next plan", () => {
    state.billing = { plan: "CHURCH", plans, people: 400, maxPeople: 400 };

    render(<PlanUsageNotice nodeId="n1" kind="people" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "llegó al máximo de 400 personas del plan Iglesia: no podrás agregar más hasta pasar al plan Red",
    );
  });

  it("offers the plans only to whoever can pay them", () => {
    state.billing = { plan: "FREE", plans, people: 45, maxPeople: 50 };
    const { rerender } = render(<PlanUsageNotice nodeId="n1" kind="people" />);
    expect(screen.queryByRole("link", { name: "Ver planes" })).toBeNull();

    state.permissions = new Set(["billing.manage"]);
    rerender(<PlanUsageNotice nodeId="n1" kind="people" />);

    expect(screen.getByRole("link", { name: "Ver planes" })).toHaveAttribute(
      "href",
      "/portal/n1/billing",
    );
  });

  it("says nothing on a plan without a maximum or while the plan is unknown", () => {
    state.billing = { plan: "NETWORK", plans, people: 9000 };
    const { rerender } = render(<PlanUsageNotice nodeId="n1" kind="people" />);
    expect(screen.queryByRole("alert")).toBeNull();

    state.billing = undefined;
    rerender(<PlanUsageNotice nodeId="n1" kind="people" />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("PlanUsageNotice for the own WhatsApp number", () => {
  it("tells who has no number of its own that it uses the one of Sr. Tommy", () => {
    state.billing = { plan: "CHURCH", plans, ownNumber: false };

    render(<PlanUsageNotice nodeId="n1" kind="ownNumber" />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "usa el número de WhatsApp de Sr. Tommy",
    );
    expect(screen.getByRole("alert")).toHaveTextContent("plan Red");
    expect(screen.getByRole("alert")).toHaveTextContent("extra");
  });

  it("says nothing once the church has its own number", () => {
    state.billing = { plan: "NETWORK", plans, ownNumber: true };

    render(<PlanUsageNotice nodeId="n1" kind="ownNumber" />);

    expect(screen.queryByRole("alert")).toBeNull();
  });
});
