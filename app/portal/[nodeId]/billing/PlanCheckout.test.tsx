import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BillingResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { PlanCheckout } from "./PlanCheckout";

const api = vi.hoisted(() => ({ checkout: vi.fn() }));

vi.mock("@/app/(api)/generated", () => ({
  postOrganizationsByIdBillingCheckout: api.checkout,
}));

const billing: BillingResponse = {
  plan: "FREE",
  people: 120,
  includedPeople: 150,
  blockSize: 100,
  prices: [
    {
      country: "PE",
      currency: "PEN",
      monthly: 75,
      yearly: 750,
      extraBlock: 35,
    },
    {
      country: "CO",
      currency: "COP",
      monthly: 85000,
      yearly: 850000,
      extraBlock: 40000,
    },
  ],
};

const showMessage = vi.fn();
const renderCheckout = (
  props: Partial<Parameters<typeof PlanCheckout>[0]> = {},
) => {
  const redirect = vi.fn();
  render(
    <SnackbarContext.Provider value={{ message: "", showMessage }}>
      <PlanCheckout
        nodeId="n1"
        billing={billing}
        redirect={redirect}
        {...props}
      />
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
  it("shows the price of a month and of a year for the people the church has", () => {
    renderCheckout();

    expect(
      screen.getByRole("heading", { name: "Pasar al plan Iglesia" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/120 personas/)).toBeInTheDocument();
    expect(screen.getByText(/75[.,]00/)).toBeInTheDocument();
    expect(screen.getByText(/750[.,]00/)).toBeInTheDocument();
  });

  it("pays a month from Peru and goes to the checkout", async () => {
    const user = userEvent.setup();
    api.checkout.mockResolvedValue({ checkoutUrl: "https://pay.test/c1" });
    const { redirect } = renderCheckout();

    await user.click(screen.getByRole("button", { name: "Pagar 1 mes" }));

    expect(api.checkout).toHaveBeenCalledWith("n1", {
      country: "PE",
      months: 1,
    });
    await waitFor(() =>
      expect(redirect).toHaveBeenCalledWith("https://pay.test/c1"),
    );
  });

  it("pays a year from Colombia after choosing the country", async () => {
    const user = userEvent.setup();
    api.checkout.mockResolvedValue({ checkoutUrl: "https://pay.test/c2" });
    renderCheckout();

    await user.click(screen.getByRole("button", { name: /Colombia/ }));
    expect(screen.getByText(/850[.,]000/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pagar 1 año" }));

    expect(api.checkout).toHaveBeenCalledWith("n1", {
      country: "CO",
      months: 12,
    });
  });

  it("starts on the country the church paid from last time", () => {
    renderCheckout({ billing: { ...billing, plan: "CHURCH", country: "CO" } });

    expect(
      screen.getByRole("heading", { name: "Renovar el plan Iglesia" }),
    ).toBeInTheDocument();
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

  it("shows nothing when the church has no price list", () => {
    renderCheckout({ billing: { plan: "FREE", prices: [] } });

    expect(screen.queryByRole("button", { name: /Pagar/ })).toBeNull();
  });
});
