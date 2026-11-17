import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { Pricing } from "./Pricing";

afterEach(cleanup);

describe("Pricing", () => {
  it("shows the two plans with their price", () => {
    render(<Pricing />);
    const plans = screen.getAllByRole("article");
    expect(plans).toHaveLength(2);
    expect(
      within(plans[0]!).getByRole("heading", { name: "Gratis" }),
    ).toBeVisible();
    expect(within(plans[0]!).getByText("S/ 0")).toBeVisible();
    expect(
      within(plans[1]!).getByRole("heading", { name: "Iglesia" }),
    ).toBeVisible();
    expect(within(plans[1]!).getByText("S/ 75")).toBeVisible();
    expect(
      within(plans[1]!).getByText(/COP 85\.000 en Colombia/),
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
    const [free] = screen.getAllByRole("article");
    expect(within(free!).getAllByRole("listitem")).toHaveLength(7);
    expect(within(free!).getByText("Hasta 50 personas y 1 sede")).toBeVisible();
    expect(
      within(free!).getByText("WhatsApp de la iglesia: prueba de 15 días"),
    ).toBeVisible();
  });

  it("sends both plans to the portal, where the plan is paid", () => {
    render(<Pricing />);
    expect(
      screen.getByRole("link", { name: "Empezar gratis" }),
    ).toHaveAttribute("href", "/portal");
    expect(
      screen.getByRole("link", { name: "Pasar al plan Iglesia" }),
    ).toHaveAttribute("href", "/portal");
  });

  it("is reachable from the page anchor", () => {
    const { container } = render(<Pricing />);
    expect(container.querySelector("#precios")).not.toBeNull();
  });

  it("no longer sells the plans that were never charged", () => {
    render(<Pricing />);
    expect(screen.queryByText(/Semilla|Crecimiento|Red\b/)).toBeNull();
  });
});

describe("PriceCalculator inside Pricing", () => {
  it("prices a church of 200 people in soles, a month and a year", () => {
    render(<Pricing />);

    expect(screen.getByRole("status")).toHaveTextContent(/110[.,]00/);
    expect(screen.getByRole("status")).toHaveTextContent(/1[.,\s]?100[.,]00/);
  });

  it("changes the price with the people and the country", async () => {
    const user = userEvent.setup();
    render(<Pricing />);

    const people = screen.getByLabelText("Personas en tu iglesia");
    await user.clear(people);
    await user.type(people, "600");
    expect(screen.getByRole("status")).toHaveTextContent(/250[.,]00/);

    await user.click(screen.getByRole("button", { name: "Colombia" }));
    // 85.000 + 5 blocks of 40.000.
    expect(screen.getByRole("status")).toHaveTextContent(/285[.,\s]?000/);
  });

  it("keeps the base price up to the people the plan includes", async () => {
    const user = userEvent.setup();
    render(<Pricing />);

    const people = screen.getByLabelText("Personas en tu iglesia");
    await user.clear(people);
    await user.type(people, "80");

    expect(screen.getByRole("status")).toHaveTextContent(/75[.,]00/);
  });

  it("asks for a real number instead of a price", async () => {
    const user = userEvent.setup();
    render(<Pricing />);

    const people = screen.getByLabelText("Personas en tu iglesia");
    await user.clear(people);

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByText(/Escribe un número de 1 a/)).toBeVisible();
  });
});
