import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BillingResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { freeBilling, plans } from "./billingFixtures";
import { PlanCheckout } from "./PlanCheckout";

const api = vi.hoisted(() => ({ checkout: vi.fn() }));

vi.mock("@/app/(api)/generated", () => ({
  postOrganizationsByIdBillingCheckout: api.checkout,
}));

const showMessage = vi.fn();
const renderCheckout = (billing: BillingResponse = freeBilling) => {
  const redirect = vi.fn();
  render(
    <SnackbarContext.Provider value={{ message: "", showMessage }}>
      <PlanCheckout nodeId="n1" billing={billing} redirect={redirect} />
    </SnackbarContext.Provider>,
  );
  return { redirect };
};

beforeEach(() => {
  api.checkout.mockReset();
  showMessage.mockReset();
});
afterEach(cleanup);

describe("PlanCheckout", () => {
  it("offers the three paid plans with their price and the cheapest that fits chosen", () => {
    renderCheckout();

    expect(
      screen.getByRole("heading", { name: "Elegir un plan" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(screen.getByRole("radio", { name: /Básico/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Básico/ })).toHaveAccessibleName(
      /45[.,]00 al mes/,
    );
    expect(screen.getByRole("radio", { name: /Iglesia/ })).toHaveAccessibleName(
      /75[.,]00 al mes/,
    );
    expect(screen.getByRole("radio", { name: /Red/ })).toHaveAccessibleName(
      /149[.,]00 al mes/,
    );
    expect(screen.getByText(/Hasta 400 personas/)).toBeInTheDocument();
    expect(screen.getByText(/Personas sin límite/)).toBeInTheDocument();
  });

  it("pays a month of Basic from Peru and goes to the checkout", async () => {
    const user = userEvent.setup();
    api.checkout.mockResolvedValue({ checkoutUrl: "https://pay.test/c1" });
    const { redirect } = renderCheckout();

    await user.click(screen.getByRole("button", { name: "Pagar 1 mes" }));

    expect(api.checkout).toHaveBeenCalledWith("n1", {
      plan: "BASIC",
      country: "PE",
      months: 1,
      ownNumber: false,
    });
    await waitFor(() =>
      expect(redirect).toHaveBeenCalledWith("https://pay.test/c1"),
    );
  });

  it("pays a year of another plan from Colombia after choosing both", async () => {
    const user = userEvent.setup();
    api.checkout.mockResolvedValue({ checkoutUrl: "https://pay.test/c2" });
    renderCheckout();

    await user.click(screen.getByRole("radio", { name: /Iglesia/ }));
    await user.click(screen.getByRole("button", { name: /Colombia/ }));
    expect(screen.getByText(/790[.,]000/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pagar 1 año" }));

    expect(api.checkout).toHaveBeenCalledWith("n1", {
      plan: "CHURCH",
      country: "CO",
      months: 12,
      ownNumber: false,
    });
  });

  it("adds the own WhatsApp number to the price when asked", async () => {
    const user = userEvent.setup();
    api.checkout.mockResolvedValue({ checkoutUrl: "https://pay.test/c3" });
    renderCheckout();

    await user.click(
      screen.getByRole("checkbox", { name: /Número de WhatsApp propio/ }),
    );
    // 45 + 49 a month, 450 + 490 a year.
    expect(screen.getByText(/94[.,]00/)).toBeInTheDocument();
    expect(screen.getByText(/940[.,]00/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pagar 1 mes" }));

    expect(api.checkout).toHaveBeenCalledWith(
      "n1",
      expect.objectContaining({ plan: "BASIC", ownNumber: true }),
    );
  });

  it("does not sell the extra number on Network, which includes it", async () => {
    const user = userEvent.setup();
    api.checkout.mockResolvedValue({ checkoutUrl: "https://pay.test/c4" });
    renderCheckout();

    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("radio", { name: /Red/ }));

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(
      screen.getByText("Este plan incluye el número de WhatsApp propio."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pagar 1 mes" }));
    expect(api.checkout).toHaveBeenCalledWith(
      "n1",
      expect.objectContaining({ plan: "NETWORK", ownNumber: false }),
    );
  });

  it("does not let the church choose a plan it already outgrew", () => {
    const outgrew: BillingResponse = {
      ...freeBilling,
      people: 200,
      plans: plans.map((plan) =>
        plan.plan === "BASIC" ? { ...plan, fits: false } : plan,
      ),
    };

    renderCheckout(outgrew);

    expect(screen.getByRole("radio", { name: /Básico/ })).toBeDisabled();
    expect(screen.getByRole("radio", { name: /Iglesia/ })).toBeChecked();
    expect(
      screen.getByText(/Tu iglesia ya tiene más de lo que incluye/),
    ).toBeInTheDocument();
  });

  it("starts on the plan and the country of the last payment, to renew", () => {
    renderCheckout({ ...freeBilling, plan: "CHURCH", country: "CO" });

    expect(
      screen.getByRole("heading", { name: "Renovar o cambiar de plan" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Iglesia/ })).toBeChecked();
    expect(screen.getByRole("button", { name: /Colombia/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("says why when the payment cannot start, and lets the pastor try again", async () => {
    const user = userEvent.setup();
    api.checkout.mockRejectedValue(new Error("boom"));
    const { redirect } = renderCheckout();

    await user.click(screen.getByRole("button", { name: "Pagar 1 mes" }));

    await waitFor(() =>
      expect(showMessage).toHaveBeenCalledWith(
        "No pudimos iniciar el pago. Intenta de nuevo.",
      ),
    );
    expect(redirect).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Pagar 1 mes" })).toBeEnabled();
  });

  it("makes only one checkout while it is being made, even from the other button", async () => {
    const user = userEvent.setup();
    api.checkout.mockReturnValue(new Promise(() => undefined));
    renderCheckout();

    await user.click(screen.getByRole("button", { name: "Pagar 1 año" }));

    expect(screen.getByRole("button", { name: "Pagar 1 año" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Pagar 1 mes" }));
    expect(api.checkout).toHaveBeenCalledOnce();
  });

  it("shows nothing when there is no paid plan to sell", () => {
    renderCheckout({ plan: "FREE", plans: [] });

    expect(screen.queryByRole("button", { name: /Pagar/ })).toBeNull();
  });
});
