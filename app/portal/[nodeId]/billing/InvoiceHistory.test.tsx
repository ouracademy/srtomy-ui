import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { InvoiceHistory } from "./InvoiceHistory";

afterEach(cleanup);

describe("InvoiceHistory", () => {
  it("says there are no payments yet", () => {
    render(<InvoiceHistory invoices={[]} />);

    expect(screen.getByText("Todavía no hay pagos.")).toBeVisible();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("lists each payment with its period, amount and state", () => {
    render(
      <InvoiceHistory
        invoices={[
          {
            id: "i2",
            status: "PENDING",
            amount: 750,
            currency: "PEN",
            months: 12,
            people: 120,
          },
          {
            id: "i1",
            status: "PAID",
            amount: 75,
            currency: "PEN",
            months: 1,
            people: 100,
            periodStart: "2026-11-16",
            periodEnd: "2026-12-15",
          },
        ]}
      />,
    );

    const rows = within(
      screen.getByRole("table", { name: "Historial de pagos" }),
    ).getAllByRole("row");
    // The header and one row per payment, newest first as the API sends them.
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent("12 meses · 120 personas");
    expect(rows[1]).toHaveTextContent("—");
    expect(rows[1]).toHaveTextContent("Pendiente");
    expect(rows[2]).toHaveTextContent("1 mes · 100 personas");
    expect(rows[2]).toHaveTextContent(
      "16 de noviembre de 2026 al 15 de diciembre de 2026",
    );
    expect(rows[2]).toHaveTextContent("Pagado");
  });
});
