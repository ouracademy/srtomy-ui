import type {
  ChildResponse,
  EventResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProgramSection } from "./ProgramSection";

vi.mock("./SubEventDialog", () => ({
  SubEventDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Agregar sub-evento" /> : null,
}));

afterEach(cleanup);

const child = (overrides: Partial<ChildResponse>): ChildResponse => ({
  id: "c1",
  title: "Taller",
  start: new Date(2026, 9, 23, 9, 0),
  end: new Date(2026, 9, 23, 11, 0),
  isACourse: false,
  registrationMode: "INHERIT",
  ...overrides,
});

const event = (children: ChildResponse[]): EventResponse => ({
  id: "mega",
  title: "Congreso",
  children,
});

const setup = (
  children: ChildResponse[],
  { canAdd = true }: { canAdd?: boolean } = {},
) => {
  const onChanged = vi.fn();
  render(
    <ProgramSection
      nodeId="n1"
      event={event(children)}
      canAdd={canAdd}
      canConfigureRegistration
      onChanged={onChanged}
    />,
  );
  return { user: userEvent.setup(), onChanged };
};

describe("ProgramSection", () => {
  it("says the program is optional when there is none, and offers to add to it", async () => {
    const { user } = setup([]);

    expect(screen.getByText(/Es opcional/)).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Agregar sub-evento" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Agregar sub-evento" }),
    ).toBeInTheDocument();
  });

  it("lists the sub-events by day, with a link, the hours and how each is entered", () => {
    setup([
      child({}),
      child({
        id: "c2",
        title: "Cena",
        isACourse: false,
        registrationMode: "OWN",
        start: new Date(2026, 9, 24, 20, 0),
        end: new Date(2026, 9, 24, 22, 0),
      }),
      child({
        id: "c3",
        title: "Escuela bíblica",
        isACourse: true,
        registrationMode: "OPEN",
      }),
    ]);

    const link = screen.getByRole("link", { name: /Taller/ });
    expect(link).toHaveAttribute("href", "/portal/n1/event/c1/attendance");
    expect(within(link).getByText("09:00 a 11:00")).toBeInTheDocument();
    expect(
      within(link).getByText("Incluido en la inscripción"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("link", { name: /Cena/ })).getByText(
        "Inscripción propia",
      ),
    ).toBeInTheDocument();
    const course = screen.getByRole("link", { name: /Escuela bíblica/ });
    expect(within(course).getByText("Curso")).toBeInTheDocument();
    expect(within(course).getByText("Sin inscripción")).toBeInTheDocument();
    expect(screen.getByText("viernes 23 de octubre")).toBeInTheDocument();
    expect(screen.getByText("sábado 24 de octubre")).toBeInTheDocument();
  });

  it("shows nothing to someone who cannot add to an event with no program", () => {
    setup([], { canAdd: false });

    expect(screen.queryByRole("region", { name: "Programa" })).toBeNull();
  });

  it("shows the program without the button to someone who cannot add", () => {
    setup([child({})], { canAdd: false });

    expect(screen.getByRole("link", { name: /Taller/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Agregar sub-evento" }),
    ).toBeNull();
  });
});
