import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { MyEventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { MyEvents } from "./MyEvents";

afterEach(cleanup);

const events: MyEventResponse[] = [
  {
    title: "Curso de discipulado",
    start: new Date(2030, 1, 2, 19, 0),
    isACourse: true,
    organizationName: "Sede Norte",
    registered: true,
    attended: true,
    slug: "abc",
  },
  {
    title: "Retiro",
    start: new Date(2030, 0, 5, 10, 0),
    isACourse: false,
    organizationName: "Jóvenes",
    registered: false,
    attended: true,
    slug: "def",
  },
];

describe("MyEvents", () => {
  it("says so when there is nothing yet", () => {
    render(<MyEvents events={[]} />);

    expect(
      screen.getByRole("heading", { name: "Mis eventos y cursos" }),
    ).toBeTruthy();
    expect(screen.getByText(/Aún no te has inscrito/)).toBeTruthy();
  });

  it("links each event to its shared page and says how it concerns the user", () => {
    render(<MyEvents events={events} />);

    const items = within(
      screen.getByRole("list", { name: "Mis eventos y cursos" }),
    ).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    const [first, second] = items as [HTMLElement, HTMLElement];
    expect(
      screen
        .getByRole("link", { name: "Curso de discipulado" })
        .getAttribute("href"),
    ).toBe("/e/abc");
    expect(within(first).getByText("Inscrito")).toBeTruthy();
    expect(within(first).getByText("Asististe")).toBeTruthy();
    expect(within(first).getByText(/Curso · Sede Norte/)).toBeTruthy();
    expect(within(second).queryByText("Inscrito")).toBeNull();
    expect(within(second).getByText("Asististe")).toBeTruthy();
  });
});
