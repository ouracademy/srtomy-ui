import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UserMenu } from "./UserMenu";

const auth = vi.hoisted(() => ({
  user: { name: "Ana Díaz" } as { name?: string } | undefined,
  logout: vi.fn(),
}));

vi.mock("@auth0/auth0-react", () => ({ useAuth0: () => auth }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

beforeEach(() => {
  auth.user = { name: "Ana Díaz" };
});

afterEach(cleanup);

describe("UserMenu", () => {
  it("names the button after the full user name", () => {
    render(<UserMenu />);

    expect(screen.getByRole("button", { name: "Ana Díaz" })).toBeTruthy();
  });

  it("renders the first letter of the name next to the full name", () => {
    render(<UserMenu />);

    const initial = screen.getByText("A");
    expect(initial.getAttribute("aria-hidden")).toBe("true");
    expect(screen.getByText("Ana Díaz")).toBeTruthy();
  });

  it("uppercases the initial", () => {
    auth.user = { name: "  ana" };
    render(<UserMenu />);

    expect(screen.getByText("A")).toBeTruthy();
  });

  it("renders no initial when there is no name", () => {
    auth.user = undefined;
    render(<UserMenu />);

    expect(screen.queryByText("A")).toBeNull();
  });

  it("opens the menu with the profile and logout options", async () => {
    const user = userEvent.setup();
    render(<UserMenu />);

    await user.click(screen.getByRole("button", { name: "Ana Díaz" }));

    expect(screen.getByRole("menuitem", { name: "Perfil" })).toBeTruthy();
    expect(
      screen.getByRole("menuitem", { name: "Cerrar sesión" }),
    ).toBeTruthy();
  });
});
