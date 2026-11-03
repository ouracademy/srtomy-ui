import type {
  ChildResponse,
  EventResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { act, cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProgramSection } from "./ProgramSection";

vi.mock("./SubEventDialog", () => ({
  SubEventDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog" aria-label="Agregar sub-evento" /> : null,
}));

const api = vi.hoisted(() => ({
  deleteEventsById: vi.fn(),
  moveSubEvent: vi.fn(),
  calendar: undefined as
    | { onMove: (id: string, start: Date, end: Date) => Promise<void> }
    | undefined,
}));
vi.mock("@/app/(api)/generated", () => ({
  deleteEventsById: (...args: unknown[]) => api.deleteEventsById(...args),
}));
vi.mock("./moveSubEvent", () => ({
  moveSubEvent: (...args: unknown[]) => api.moveSubEvent(...args),
}));
vi.mock("./ProgramCalendar", () => ({
  ProgramCalendar: (props: {
    onMove: (id: string, start: Date, end: Date) => Promise<void>;
  }) => {
    api.calendar = props;
    return <div data-testid="program-calendar" />;
  },
}));

beforeEach(() => {
  api.deleteEventsById.mockReset();
  api.moveSubEvent.mockReset();
});
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
  start: new Date(2026, 9, 23, 8, 0),
  end: new Date(2026, 9, 25, 22, 0),
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

    // Every link is inside a list item, as a list requires.
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    const link = screen.getByRole("link", { name: /^Taller/ });
    expect(link).toHaveAttribute("href", "/portal/n1/event/c1/attendance");
    expect(within(link).getByText("09:00 a 11:00")).toBeInTheDocument();
    expect(
      within(link).getByText("Incluido en la inscripción"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("link", { name: /^Cena/ })).getByText(
        "Inscripción propia",
      ),
    ).toBeInTheDocument();
    const course = screen.getByRole("link", { name: /^Escuela bíblica/ });
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

    expect(screen.getByRole("link", { name: /^Taller/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Agregar sub-evento" }),
    ).toBeNull();
  });

  it("starts open and can be collapsed and opened again", async () => {
    const { user } = setup([]);
    const header = screen.getByRole("button", { name: "Programa" });

    expect(header).toHaveAttribute("aria-expanded", "true");
    await user.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
    await user.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
  });

  it("shows a calendar of the program when there are sub-events", () => {
    setup([child({})]);

    expect(screen.getByTestId("program-calendar")).toBeInTheDocument();
  });

  it("deletes a sub-event after asking, and reads the event again", async () => {
    api.deleteEventsById.mockResolvedValue(undefined);
    const { user, onChanged } = setup([child({})]);

    await user.click(screen.getByRole("button", { name: "Eliminar Taller" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(api.deleteEventsById).toHaveBeenCalledWith("c1", {
      option: "THIS_EVENT",
    });
    await vi.waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("keeps the sub-event when the user cancels the deletion", async () => {
    const { user, onChanged } = setup([child({})]);

    await user.click(screen.getByRole("button", { name: "Eliminar Taller" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(api.deleteEventsById).not.toHaveBeenCalled();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("offers to edit a sub-event on its own screen", () => {
    setup([child({})]);

    expect(screen.getByRole("link", { name: "Editar Taller" })).toHaveAttribute(
      "href",
      "/portal/n1/event/c1/attendance",
    );
  });

  it("offers neither edit nor delete to someone who cannot write", () => {
    setup([child({})], { canAdd: false });

    expect(screen.queryByRole("link", { name: "Editar Taller" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Eliminar Taller" }),
    ).toBeNull();
  });

  it("moves a sub-event dragged in the calendar and reads the event again", async () => {
    api.moveSubEvent.mockResolvedValue({ id: "c1" });
    const { onChanged } = setup([child({})]);
    const start = new Date(2026, 9, 24, 9, 0);
    const end = new Date(2026, 9, 24, 11, 0);

    await act(() => api.calendar!.onMove("c1", start, end));

    expect(api.moveSubEvent).toHaveBeenCalledWith("c1", start, end);
    expect(onChanged).toHaveBeenCalled();
  });

  it("rejects a failed move so the calendar puts the sub-event back", async () => {
    api.moveSubEvent.mockRejectedValue(new Error("fuera del evento"));
    const { onChanged } = setup([child({})]);

    await expect(
      act(() => api.calendar!.onMove("c1", new Date(), new Date())),
    ).rejects.toThrow();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("starts as a button in an event of one day with no program, and opens the section", async () => {
    const onChanged = vi.fn();
    render(
      <ProgramSection
        nodeId="n1"
        event={{
          id: "culto",
          title: "Culto",
          start: new Date(2026, 9, 23, 9, 0),
          end: new Date(2026, 9, 23, 11, 0),
          children: [],
        }}
        canAdd
        canConfigureRegistration
        onChanged={onChanged}
      />,
    );
    const user = userEvent.setup();

    expect(screen.queryByRole("region", { name: "Programa" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Armar un programa" }));

    expect(
      screen.getByRole("region", { name: "Programa" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Agregar sub-evento" }),
    ).toBeInTheDocument();
  });

  it("shows the program of an event of one day when it already has sub-events", () => {
    render(
      <ProgramSection
        nodeId="n1"
        event={{
          id: "jornada",
          title: "Jornada",
          start: new Date(2026, 9, 23, 8, 0),
          end: new Date(2026, 9, 23, 20, 0),
          children: [child({})],
        }}
        canAdd
        canConfigureRegistration
        onChanged={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Programa" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Armar un programa" }),
    ).toBeNull();
  });
});
