import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Pricing } from "./Pricing";

afterEach(cleanup);

describe("Pricing", () => {
  it("shows the four plans with their price", () => {
    render(<Pricing />);
    const plans = screen.getAllByRole("article");
    expect(plans).toHaveLength(4);
    const names = ["Gratis", "Básico", "Iglesia", "Red"];
    const prices = ["S/ 0", "S/ 45", "S/ 75", "S/ 149"];
    plans.forEach((plan, index) => {
      expect(
        within(plan).getByRole("heading", { name: names[index] }),
      ).toBeVisible();
      expect(within(plan).getByText(prices[index]!)).toBeVisible();
    });
    expect(
      within(plans[2]!).getByText(/COP 79\.000 en Colombia/),
    ).toBeVisible();
  });

  it("marks only the Iglesia plan as recommended", () => {
    render(<Pricing />);
    const recommended = screen.getAllByText("Recomendado");
    expect(recommended).toHaveLength(1);
    expect(
      within(recommended[0]!.closest("article")!).getByRole("heading", {
        name: "Iglesia",
      }),
    ).toBeVisible();
  });

  it("lists what each plan includes and its limits", () => {
    render(<Pricing />);
    const [free, basic, , network] = screen.getAllByRole("article");
    expect(within(free!).getAllByRole("listitem")).toHaveLength(6);
    expect(within(free!).getByText("Hasta 50 personas y 1 sede")).toBeVisible();
    expect(
      within(basic!).getByText("Asistente de IA: 150 mensajes al mes"),
    ).toBeVisible();
    expect(
      within(network!).getByText("Personas y sedes sin límite"),
    ).toBeVisible();
    expect(
      within(network!).getByText("Número de WhatsApp propio incluido"),
    ).toBeVisible();
  });

  it("explains that the own number is an extra of two plans and included in Red", () => {
    render(<Pricing />);
    expect(
      screen.getByText(/extra de S\/ 49 al mes \(COP 49\.000\)/),
    ).toBeVisible();
  });

  it("sends every plan to the portal", () => {
    render(<Pricing />);
    expect(
      screen.getByRole("link", { name: "Empezar gratis" }),
    ).toHaveAttribute("href", "/portal");
    for (const name of ["Elegir Básico", "Elegir Iglesia", "Elegir Red"]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute(
        "href",
        "/portal",
      );
    }
  });

  it("is reachable from the page anchor", () => {
    const { container } = render(<Pricing />);
    expect(container.querySelector("#precios")).not.toBeNull();
  });

  it("no longer sells the plans that were never charged", () => {
    render(<Pricing />);
    expect(screen.queryByText(/Semilla|Crecimiento/)).toBeNull();
  });
});
