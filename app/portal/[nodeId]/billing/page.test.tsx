import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import BillingPage from "./page";

const hooks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  billing: {
    data: undefined as unknown,
    error: undefined as unknown,
    isLoading: false,
  },
  invoices: [] as unknown[],
  invoicesEnabled: [] as boolean[],
  search: "",
  sync: vi.fn(),
  refreshBilling: vi.fn(),
  refreshInvoices: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(hooks.search),
}));

vi.mock("@/app/(hooks)/usePermissions", () => ({
  usePermissions: () => ({ can: (p: string) => hooks.permissions.has(p) }),
}));

vi.mock("@/app/(api)/generated", () => ({
  useGetOrganizationsByIdBilling: () => ({
    ...hooks.billing,
    mutate: hooks.refreshBilling,
  }),
  useGetOrganizationsByIdBillingInvoices: (
    _id: string,
    options?: { swr?: { enabled?: boolean } },
  ) => {
    hooks.invoicesEnabled.push(options?.swr?.enabled ?? true);
    return { data: hooks.invoices, mutate: hooks.refreshInvoices };
  },
  postOrganizationsByIdBillingSync: hooks.sync,
  postOrganizationsByIdBillingCheckout: vi.fn(),
}));

vi.mock("@/app/(components)/ResourceError", () => ({
  ResourceError: () => <p>Error al cargar</p>,
}));

const free = {
  plan: "FREE",
  status: "FREE",
  people: 10,
  locations: 1,
  maxPeople: 50,
  maxLocations: 1,
  features: [],
  prices: [
    {
      country: "PE",
      currency: "PEN",
      monthly: 75,
      yearly: 750,
      extraBlock: 35,
    },
  ],
  includedPeople: 150,
  blockSize: 100,
};

const showMessage = vi.fn();
const renderPage = async () => {
  const params = Promise.resolve({ nodeId: "n1" });
  await act(async () => {
    render(
      <SnackbarContext.Provider value={{ message: "", showMessage }}>
        <Suspense fallback={null}>
          <BillingPage params={params} />
        </Suspense>
      </SnackbarContext.Provider>,
    );
    await params;
  });
};

beforeEach(() => {
  hooks.permissions = new Set();
  hooks.billing = { data: free, error: undefined, isLoading: false };
  hooks.invoices = [];
  hooks.invoicesEnabled = [];
  hooks.search = "";
  hooks.sync.mockReset();
  hooks.refreshBilling.mockReset().mockResolvedValue(undefined);
  hooks.refreshInvoices.mockReset().mockResolvedValue(undefined);
  showMessage.mockReset();
});
afterEach(cleanup);

describe("the plan and payments page", () => {
  it("shows the plan to anyone, but not paying nor the payments", async () => {
    await renderPage();

    expect(screen.getByRole("heading", { name: "Plan y pagos" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Plan Gratis" })).toBeVisible();
    expect(screen.getByText(/Solo quien administra la iglesia/)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Pagar 1 mes" }),
    ).not.toBeInTheDocument();
    expect(hooks.invoicesEnabled.every((enabled) => !enabled)).toBe(true);
  });

  it("lets whoever manages the plan pay and see the payments", async () => {
    hooks.permissions = new Set(["billing.manage"]);
    hooks.invoices = [
      { id: "i1", status: "PAID", amount: 75, currency: "PEN", months: 1 },
    ];

    await renderPage();

    expect(screen.getByRole("button", { name: "Pagar 1 mes" })).toBeVisible();
    expect(
      screen.getByRole("table", { name: "Historial de pagos" }),
    ).toBeVisible();
    expect(hooks.sync).not.toHaveBeenCalled();
  });

  it("asks the provider once when the pastor comes back from the checkout, and welcomes the plan", async () => {
    hooks.permissions = new Set(["billing.manage"]);
    hooks.search = "pago=completado";
    hooks.sync.mockResolvedValue({ ...free, plan: "CHURCH", status: "ACTIVE" });

    await renderPage();

    await waitFor(() =>
      expect(showMessage).toHaveBeenCalledWith(
        "¡Listo! El plan Iglesia está activo.",
      ),
    );
    expect(hooks.sync).toHaveBeenCalledExactlyOnceWith("n1");
    expect(hooks.refreshBilling).toHaveBeenCalled();
    expect(hooks.refreshInvoices).toHaveBeenCalled();
  });

  it("says to come back when the payment is not confirmed yet", async () => {
    hooks.permissions = new Set(["billing.manage"]);
    hooks.search = "pago=completado";
    hooks.sync.mockResolvedValue({ ...free, status: "FREE" });

    await renderPage();

    await waitFor(() =>
      expect(showMessage).toHaveBeenCalledWith(
        expect.stringContaining("esperando la confirmación"),
      ),
    );
  });

  it("explains when the payment could not be checked", async () => {
    hooks.permissions = new Set(["billing.manage"]);
    hooks.search = "pago=completado";
    hooks.sync.mockRejectedValue(new Error("down"));

    await renderPage();

    await waitFor(() =>
      expect(showMessage).toHaveBeenCalledWith(
        "No pudimos confirmar el pago ahora.",
      ),
    );
  });

  it("does not check the payments of someone who cannot manage the plan", async () => {
    hooks.search = "pago=completado";

    await renderPage();

    expect(hooks.sync).not.toHaveBeenCalled();
  });

  it("shows the error when the plan cannot be read", async () => {
    hooks.billing = {
      data: undefined,
      error: new Error("x"),
      isLoading: false,
    };

    await renderPage();

    expect(screen.getByText("Error al cargar")).toBeVisible();
  });

  it("shows the loading state while the plan loads", async () => {
    hooks.billing = { data: undefined, error: undefined, isLoading: true };

    await renderPage();

    expect(screen.queryByText("Error al cargar")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Plan y pagos" })).toBeNull();
  });
});
