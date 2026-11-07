import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LandingFooter } from "./LandingFooter";

afterEach(cleanup);

describe("LandingFooter", () => {
  it("shows the contact email and phone", () => {
    render(<LandingFooter />);
    expect(screen.getByRole("heading", { name: "CONTACTO" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "info@sr-tommy.com" }),
    ).toHaveAttribute("href", "mailto:info@sr-tommy.com");
    expect(screen.getByRole("link", { name: /Consultas al/ })).toHaveAttribute(
      "href",
      "tel:+51941475889",
    );
    expect(screen.getByText("Consultas al: +51 941 475 889")).toBeVisible();
  });

  it("keeps the brand and the legal links", () => {
    render(<LandingFooter />);
    expect(screen.getByText("© Oveja Fiel")).toBeVisible();
    const legal = screen.getByRole("navigation", { name: "Legal" });
    expect(legal).toHaveTextContent("Términos y condiciones");
    expect(
      screen.getByRole("link", { name: "Libro de reclamaciones" }),
    ).toHaveAttribute("href", "/complaints-book");
  });

  it("has a black background and renders without the landing theme around it", () => {
    render(<LandingFooter />);
    const footer = screen.getByRole("contentinfo");
    expect(getComputedStyle(footer).backgroundColor).toBe("rgb(0, 0, 0)");
    expect(getComputedStyle(footer).fontFamily).toContain("--font-roboto");
  });
});
