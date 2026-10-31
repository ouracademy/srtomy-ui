import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LinkButton } from "./LinkButton";

afterEach(cleanup);

describe("LinkButton", () => {
  it("renders an internal page as a plain link in the same tab", () => {
    render(<LinkButton href="/portal">Entrar</LinkButton>);
    const link = screen.getByRole("link", { name: "Entrar" });
    expect(link).toHaveAttribute("href", "/portal");
    expect(link).not.toHaveAttribute("target");
  });

  it("renders an anchor of the same page in the same tab", () => {
    render(<LinkButton href="#precios">Ver precios</LinkButton>);
    expect(
      screen.getByRole("link", { name: "Ver precios" }),
    ).not.toHaveAttribute("target");
  });

  it("opens an external site in a new tab without leaking the opener", () => {
    render(<LinkButton href="https://wa.me/51941475889">Chat</LinkButton>);
    const link = screen.getByRole("link", { name: "Chat" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
