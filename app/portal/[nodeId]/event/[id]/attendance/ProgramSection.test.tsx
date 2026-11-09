import type {
  ChildResponse,
  EventResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProgramSection } from "./ProgramSection";

const api = vi.hoisted(() => ({
  deleteEventsById: vi.fn(),
  moveSubEvent: vi.fn(),
  calendar: undefined as
    | {
        onMove: (id: string, start: Date, end: Date) => Promise<void>;
        onCreate: (start: Date, end: Date) => void;
        onPick: (id: string, element: HTMLElement) => void;
      }
    | undefined,
  dialog: undefined as
    { initialRange?: { start: Date; end: Date } } | undefined,
}));
vi.mock("@/app/(api)/generated", () => ({
  deleteEventsById: (...args: unknown[]) => api.deleteEventsById(...args),
}));
vi.mock("./moveSubEvent", () => ({
  moveSubEvent: (...args: unknown[]) => api.moveSubEvent(...args),
}));
vi.mock("./ProgramCalendar", () => ({
  ProgramCalendar: (props: NonNullable<typeof api.calendar>) => {
    api.calendar = props;
    return <div data-testid="program-calendar" />;
  },
}));
vi.mock("./SubEventDialog", () => ({
  SubEventDialog: (props: { initialRange?: { start: Date; end: Date } }) => {
    api.dialog = props;
    return <div role="dialog" aria-label="Agregar sub-evento" />;
  },
}));

beforeEach(() => {
  api.deleteEventsById.mockReset();
  api.moveSubEvent.mockReset();
  api.calendar = undefined;
  api.dialog = undefined;
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

const manyDays = (children: ChildResponse[]): EventResponse => ({
  id: "mega",
  title: "Congreso",
  start: new Date(2026, 9, 23, 8, 0),
  end: new Date(2026, 9, 25, 22, 0),
  children,
});

const oneDay = (children: ChildResponse[]): EventResponse => ({
  id: "culto",
  title: "Culto",
  start: new Date(2026, 9, 23, 9, 0),
  end: new Date(2026, 9, 23, 11, 0),
  children,
});

const setup = (
  event: EventResponse,
  { canAdd = true }: { canAdd?: boolean } = {},
) => {
  const onChanged = vi.fn();
  render(
    <ProgramSection
      nodeId="n1"
      event={event}
      canAdd={canAdd}
      canConfigureRegistration
      onChanged={onChanged}
    />,
  );
  return { user: userEvent.setup(), onChanged };
};

describe("ProgramSection", () => {
  it("is open with its calendar in an event of several days, even with no sessions", () => {
    setup(manyDays([]));

    expect(screen.getByRole("button", { name: /Programa/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("Sin sesiones todavía")).toBeInTheDocument();
    expect(screen.getByTestId("program-calendar")).toBeInTheDocument();
  });

  it("starts closed in an event of one day with no sessions, and opens", async () => {
    const { user } = setup(oneDay([]));
    const header = screen.getByRole("button", { name: /Programa/ });

    expect(header).toHaveAttribute("aria-expanded", "false");
    await user.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
  });

  it("starts open when an event of one day already has sessions", () => {
    setup(oneDay([child({})]));

    expect(screen.getByRole("button", { name: /Programa/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(screen.getByText("1 sesión")).toBeInTheDocument();
  });

  it("shows nothing to someone who cannot add to an event with no sessions", () => {
    setup(manyDays([]), { canAdd: false });

    expect(screen.queryByRole("button", { name: /Programa/ })).toBeNull();
  });

  it("opens the form to add a session with the hours dragged on the calendar", () => {
    setup(manyDays([]));
    const from = new Date(2026, 9, 24, 17);
    const to = new Date(2026, 9, 24, 18);

    act(() => api.calendar!.onCreate(from, to));

    expect(
      screen.getByRole("dialog", { name: "Agregar sub-evento" }),
    ).toBeInTheDocument();
    expect(api.dialog?.initialRange).toEqual({ start: from, end: to });
  });

  it("opens the same form without hours from the button", async () => {
    const { user } = setup(manyDays([]));

    await user.click(
      screen.getByRole("button", { name: "Agregar sub-evento" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Agregar sub-evento" }),
    ).toBeInTheDocument();
    expect(api.dialog?.initialRange).toBeUndefined();
  });

  it("shows what can be done with a session once it is clicked", () => {
    setup(manyDays([child({})]));

    act(() => api.calendar!.onPick("c1", document.body));

    expect(
      screen.getByRole("link", { name: "Abrir y editar" }),
    ).toHaveAttribute("href", "/portal/n1/event/c1/attendance");
  });

  it("deletes a session after asking, and reads the event again", async () => {
    api.deleteEventsById.mockResolvedValue(undefined);
    const { user, onChanged } = setup(manyDays([child({})]));
    act(() => api.calendar!.onPick("c1", document.body));

    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    await user.click(
      await screen.findByRole("button", { name: "Eliminar", hidden: false }),
    );

    expect(api.deleteEventsById).toHaveBeenCalledWith("c1", {
      option: "THIS_EVENT",
    });
    await vi.waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("moves a session dragged in the calendar and reads the event again", async () => {
    api.moveSubEvent.mockResolvedValue({ id: "c1" });
    const { onChanged } = setup(manyDays([child({})]));
    const start = new Date(2026, 9, 24, 9, 0);
    const end = new Date(2026, 9, 24, 11, 0);

    await act(() => api.calendar!.onMove("c1", start, end));

    expect(api.moveSubEvent).toHaveBeenCalledWith("c1", start, end);
    expect(onChanged).toHaveBeenCalled();
  });

  it("rejects a failed move so the calendar puts the session back", async () => {
    api.moveSubEvent.mockRejectedValue(new Error("fuera del evento"));
    const { onChanged } = setup(manyDays([child({})]));

    await expect(
      act(() => api.calendar!.onMove("c1", new Date(), new Date())),
    ).rejects.toThrow();
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("shows the program as a calendar or as a list, in two tabs", async () => {
    const { user } = setup(manyDays([child({})]));

    expect(screen.getByRole("tab", { name: "Calendario" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByTestId("program-calendar")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^Taller/ })).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Lista" }));
    expect(screen.getByRole("link", { name: /^Taller/ })).toBeInTheDocument();
    expect(screen.queryByTestId("program-calendar")).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Calendario" }));
    expect(screen.getByTestId("program-calendar")).toBeInTheDocument();
  });

  it("says there are no sessions in the list when the program is empty", async () => {
    const { user } = setup(manyDays([]));

    await user.click(screen.getByRole("tab", { name: "Lista" }));

    expect(screen.getByText("Sin sesiones todavía.")).toBeInTheDocument();
  });
});
