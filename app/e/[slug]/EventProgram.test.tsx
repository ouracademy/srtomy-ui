import type { ProgramItemResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EventProgram } from "./EventProgram";

afterEach(cleanup);

const item = (
  overrides: Partial<ProgramItemResponse>,
): ProgramItemResponse => ({
  slug: "taller",
  title: "Taller",
  start: new Date(2026, 9, 23, 9, 0),
  end: new Date(2026, 9, 23, 11, 0),
  isACourse: false,
  registrationMode: "INHERIT",
  includedInTicket: true,
  ...overrides,
});

describe("EventProgram", () => {
  it("shows nothing without a program", () => {
    render(<EventProgram program={[]} />);

    expect(screen.queryByRole("region", { name: "Programa" })).toBeNull();
  });

  it("lists the sub-events by day, each with a link to its page and how to get in", () => {
    render(
      <EventProgram
        program={[
          item({}),
          item({
            slug: "cena",
            title: "Cena",
            registrationMode: "OWN",
            includedInTicket: false,
            start: new Date(2026, 9, 24, 20, 0),
            end: new Date(2026, 9, 24, 22, 0),
          }),
          item({
            slug: "escuela",
            title: "Escuela bíblica",
            isACourse: true,
            registrationMode: "OPEN",
            includedInTicket: false,
          }),
        ]}
      />,
    );

    // Every link is inside a list item, as a list requires.
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    const taller = screen.getByRole("link", { name: /Taller/ });
    expect(taller).toHaveAttribute("href", "/e/taller");
    expect(within(taller).getByText("09:00 a 11:00")).toBeInTheDocument();
    expect(
      within(taller).getByText("Incluido en tu inscripción"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("link", { name: /Cena/ })).getByText(
        "Con inscripción aparte",
      ),
    ).toBeInTheDocument();
    const escuela = screen.getByRole("link", { name: /Escuela bíblica/ });
    expect(within(escuela).getByText("Curso")).toBeInTheDocument();
    expect(within(escuela).getByText("Sin inscripción")).toBeInTheDocument();
    expect(screen.getByText("viernes 23 de octubre")).toBeInTheDocument();
    expect(screen.getByText("sábado 24 de octubre")).toBeInTheDocument();
  });
});
