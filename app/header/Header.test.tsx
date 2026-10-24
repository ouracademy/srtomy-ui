import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Header from "./Header";

const useAuth0 = vi.fn();
vi.mock("@auth0/auth0-react", () => ({ useAuth0: () => useAuth0() }));

afterEach(() => {
  cleanup();
  useAuth0.mockReset();
});

const logo = { src: "/logo.png", width: 60, height: 60 };

describe("Header", () => {
  it("offers to log in when there is no session", () => {
    useAuth0.mockReturnValue({ isAuthenticated: false, isLoading: false });
    render(<Header src={logo} alt="Logo" />);
    expect(
      screen.getByRole("link", { name: "Iniciar sesión" }),
    ).toHaveAttribute("href", "/portal");
  });

  it("links to the portal instead of login when already signed in", () => {
    useAuth0.mockReturnValue({ isAuthenticated: true, isLoading: false });
    render(<Header src={logo} alt="Logo" />);
    expect(screen.getByRole("link", { name: "Ir al portal" })).toHaveAttribute(
      "href",
      "/portal",
    );
    expect(screen.queryByText("Iniciar sesión")).not.toBeInTheDocument();
  });

  it("shows neither button while the session is loading", () => {
    useAuth0.mockReturnValue({ isAuthenticated: false, isLoading: true });
    render(<Header src={logo} alt="Logo" />);
    expect(screen.queryByText("Iniciar sesión")).not.toBeInTheDocument();
    expect(screen.queryByText("Ir al portal")).not.toBeInTheDocument();
  });
});
