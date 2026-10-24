import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { SharedWithMeResponse } from "@/app/(api)/generated/aPISrTommy.schemas";
import { SharedWithMe } from "./SharedWithMe";

afterEach(cleanup);

const events: SharedWithMeResponse[] = [
  {
    title: "Retiro",
    start: new Date(2030, 0, 5, 10, 0),
    isACourse: false,
    organizationName: "Jóvenes",
    role: "EDITOR",
    slug: "abc",
  },
  {
    title: "Curso de discipulado",
    start: new Date(2030, 1, 2, 19, 0),
    isACourse: true,
    organizationName: "Sede Norte",
    role: "VIEWER",
    slug: "def",
  },
];

describe("SharedWithMe", () => {
  it("shows nothing when nothing was shared", () => {
    const { container } = render(<SharedWithMe events={[]} />);

    expect(container.textContent).toBe("");
  });

  it("links each event to its shared page with what it is and the role", () => {
    render(<SharedWithMe events={events} />);

    expect(
      screen.getByRole("heading", { name: "Compartidos contigo" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Retiro" }).getAttribute("href"),
    ).toBe("/e/abc");
    expect(
      screen
        .getByRole("link", { name: "Curso de discipulado" })
        .getAttribute("href"),
    ).toBe("/e/def");
    expect(
      screen.getByText("Evento · Jóvenes · 5 de enero 2030 · Editor"),
    ).toBeTruthy();
    expect(
      screen.getByText("Curso · Sede Norte · 2 de febrero 2030 · Lector"),
    ).toBeTruthy();
  });
});
