import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Pricing } from "./Pricing";

afterEach(cleanup);

describe("Pricing", () => {
  it("shows the three plans with their monthly price in soles", () => {
    render(<Pricing />);
    const plans = screen.getAllByRole("article");
    expect(plans).toHaveLength(3);
    expect(
      within(plans[0]!).getByRole("heading", { name: "Semilla" }),
    ).toBeVisible();
    expect(within(plans[0]!).getByText("S/ 0")).toBeVisible();
    expect(within(plans[1]!).getByText("S/ 69")).toBeVisible();
    expect(within(plans[2]!).getByText("S/ 149")).toBeVisible();
  });

  it("marks only the Crecimiento plan as recommended", () => {
    render(<Pricing />);
    const recommended = screen.getAllByText("Recomendado");
    expect(recommended).toHaveLength(1);
    expect(
      within(recommended[0]!.closest("article")!).getByRole("heading", {
        name: "Crecimiento",
      }),
    ).toBeVisible();
  });

  it("lists what each plan includes", () => {
    render(<Pricing />);
    const [free] = screen.getAllByRole("article");
    expect(within(free!).getAllByRole("listitem")).toHaveLength(5);
    expect(within(free!).getByText("Hasta 50 personas")).toBeVisible();
  });

  it("starts the free plan in the portal", () => {
    render(<Pricing />);
    expect(
      screen.getByRole("link", { name: "Empezar gratis" }),
    ).toHaveAttribute("href", "/portal");
  });

  it("opens a WhatsApp chat naming the paid plan", () => {
    render(<Pricing />);
    const link = screen.getByRole("link", { name: "Elegir Red" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(decodeURIComponent(link.getAttribute("href") ?? "")).toContain(
      "Hola, quiero el plan Red de Oveja Fiel",
    );
  });

  it("is reachable from the page anchor", () => {
    const { container } = render(<Pricing />);
    expect(container.querySelector("#precios")).not.toBeNull();
  });
});
