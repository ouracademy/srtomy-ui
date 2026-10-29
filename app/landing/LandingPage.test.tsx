import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LandingPage } from "./LandingPage";

vi.mock("@auth0/auth0-react", () => ({
  useAuth0: () => ({ isAuthenticated: false, isLoading: false }),
}));

afterEach(cleanup);

describe("LandingPage", () => {
  it("has a single main heading with the value proposition", () => {
    render(<LandingPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Administra tu iglesia en un solo lugar.",
    );
  });

  it("presents each section under its own heading", () => {
    render(<LandingPage />);
    for (const name of [
      "Todo lo que tu iglesia necesita, conectado.",
      "Empieza en cuatro pasos.",
      "Cada persona ve lo que le corresponde.",
      "Empieza gratis. Paga cuando tu iglesia crezca.",
      "Prueba Oveja Fiel con tu iglesia.",
    ]) {
      expect(screen.getByRole("heading", { level: 2, name })).toBeVisible();
    }
  });

  it("describes the four steps in order", () => {
    render(<LandingPage />);
    const steps = screen.getAllByRole("heading", { level: 3 });
    const titles = steps.map((step) => step.textContent);
    expect(titles).toEqual(
      expect.arrayContaining([
        "Crea tu iglesia",
        "Arma tu estructura",
        "Invita a tu equipo",
        "Toma asistencia",
      ]),
    );
  });

  it("does not ask for a demo anywhere", () => {
    render(<LandingPage />);
    expect(screen.queryByText(/demo/i)).not.toBeInTheDocument();
  });

  it("links the pricing button of the hero to the pricing section", () => {
    render(<LandingPage />);
    expect(screen.getByRole("link", { name: "Ver precios" })).toHaveAttribute(
      "href",
      "#precios",
    );
  });

  it("keeps the legal links in the footer", () => {
    render(<LandingPage />);
    const legal = screen.getByRole("navigation", { name: "Legal" });
    expect(legal).toHaveTextContent("Términos y condiciones");
    expect(
      screen.getByRole("link", { name: "Libro de reclamaciones" }),
    ).toHaveAttribute("href", "/complaints-book");
    expect(
      screen.getByRole("link", { name: "Política de privacidad" }),
    ).toHaveAttribute("href", "/privacy-policy");
  });

  it("offers contact by email, phone and WhatsApp", () => {
    render(<LandingPage />);
    expect(
      screen.getByRole("link", { name: "Escríbenos por WhatsApp" }),
    ).toHaveAttribute("href", "https://wa.me/51941475889");
    expect(
      screen.getByRole("link", { name: "+51 941 475 889" }),
    ).toHaveAttribute("href", "tel:+51941475889");
  });

  it("hides the product illustration from assistive technology", () => {
    render(<LandingPage />);
    expect(
      screen.getByText("Ana Rojas").closest('[aria-hidden="true"]'),
    ).not.toBeNull();
  });
});
