import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LandingHeader } from "./LandingHeader";

const useAuth0 = vi.fn();
vi.mock("@auth0/auth0-react", () => ({ useAuth0: () => useAuth0() }));

afterEach(() => {
  cleanup();
  useAuth0.mockReset();
});

describe("LandingHeader", () => {
  it("shows the brand linking to the home page", () => {
    useAuth0.mockReturnValue({ isAuthenticated: false, isLoading: false });
    render(<LandingHeader />);
    expect(screen.getByRole("link", { name: "Oveja Fiel" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("offers to log in or start for free without a session", () => {
    useAuth0.mockReturnValue({ isAuthenticated: false, isLoading: false });
    render(<LandingHeader />);
    expect(
      screen.getByRole("link", { name: "Iniciar sesión" }),
    ).toHaveAttribute("href", "/portal");
    expect(
      screen.getByRole("link", { name: "Empezar gratis" }),
    ).toHaveAttribute("href", "/portal");
  });

  it("links to the portal when already signed in", () => {
    useAuth0.mockReturnValue({ isAuthenticated: true, isLoading: false });
    render(<LandingHeader />);
    expect(screen.getByRole("link", { name: "Ir al portal" })).toHaveAttribute(
      "href",
      "/portal",
    );
    expect(screen.queryByText("Iniciar sesión")).not.toBeInTheDocument();
    expect(screen.queryByText("Empezar gratis")).not.toBeInTheDocument();
  });

  it("shows no session buttons while the session loads", () => {
    useAuth0.mockReturnValue({ isAuthenticated: false, isLoading: true });
    render(<LandingHeader />);
    expect(screen.queryByText("Iniciar sesión")).not.toBeInTheDocument();
    expect(screen.queryByText("Ir al portal")).not.toBeInTheDocument();
  });
});
