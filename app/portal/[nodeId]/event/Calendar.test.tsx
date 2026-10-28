import { act, cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Calendar from "./Calendar";

type Source = (
  info: { start: Date; end: Date },
  success: (events: { title: string }[]) => void,
  failure: (error: unknown) => void,
) => Promise<unknown>;

const calendar = vi.hoisted(() => ({
  sources: [] as Source[],
  loading: undefined as ((loading: boolean) => void) | undefined,
  refetchEvents: vi.fn(),
  getEvents: vi.fn(),
}));

vi.mock("@fullcalendar/react", async () => {
  const react = await import("react");
  return {
    default: react.forwardRef(function FullCalendarMock(
      props: { events: Source; loading?: (loading: boolean) => void },
      ref: React.Ref<{ getApi: () => { refetchEvents: () => void } }>,
    ) {
      calendar.sources.push(props.events);
      calendar.loading = props.loading;
      react.useImperativeHandle(ref, () => ({
        getApi: () => ({ refetchEvents: calendar.refetchEvents }),
      }));
      return null;
    }),
  };
});
vi.mock("@fullcalendar/interaction", () => ({ default: {} }));
vi.mock("@fullcalendar/timegrid", () => ({ default: {} }));
vi.mock("@fullcalendar/list", () => ({ default: {} }));
vi.mock("@fullcalendar/core/locales/es", () => ({ default: {} }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/(api)/generated", () => ({
  getEvents: (...args: unknown[]) => calendar.getEvents(...args),
}));

beforeEach(() => {
  calendar.sources = [];
  calendar.loading = undefined;
  calendar.refetchEvents.mockReset();
  calendar.getEvents.mockReset();
});
afterEach(cleanup);

describe("Calendar", () => {
  it("does not ask for the events again when the page renders again", () => {
    const { rerender } = render(
      <Calendar organizationId="n1" onSelect={vi.fn()} />,
    );

    // The page renders again (for example, when the dialog to add an event
    // opens) and hands the calendar a new function.
    rerender(<Calendar organizationId="n1" onSelect={vi.fn()} />);

    expect(calendar.sources.length).toBeGreaterThan(0);
    expect(new Set(calendar.sources).size).toBe(1);
  });

  it("does ask again when it is another node", () => {
    const { rerender } = render(
      <Calendar organizationId="n1" onSelect={vi.fn()} />,
    );

    rerender(<Calendar organizationId="n2" onSelect={vi.fn()} />);

    expect(new Set(calendar.sources).size).toBe(2);
  });

  it("loads the events of the node in the range and marks where they come from", async () => {
    calendar.getEvents.mockResolvedValue([
      { id: "e1", title: "Culto", organization: { id: "n1", name: "Sede" } },
    ]);
    render(<Calendar organizationId="n1" onSelect={vi.fn()} />);
    const start = new Date(2030, 0, 1);
    const end = new Date(2030, 0, 8);
    const success = vi.fn();

    await calendar.sources[0]?.({ start, end }, success, vi.fn());

    expect(calendar.getEvents).toHaveBeenCalledWith({
      organizationId: "n1",
      start,
      end,
    });
    expect(success.mock.calls[0]?.[0]).toMatchObject([{ title: "Culto" }]);
  });

  it("reports the failure to the calendar", async () => {
    calendar.getEvents.mockRejectedValue(new Error("500"));
    render(<Calendar organizationId="n1" onSelect={vi.fn()} />);
    const failure = vi.fn();

    await calendar.sources[0]?.(
      { start: new Date(), end: new Date() },
      vi.fn(),
      failure,
    );

    expect(failure).toHaveBeenCalledOnce();
  });

  it("shows a progress bar while the calendar loads the events", () => {
    render(<Calendar organizationId="n1" onSelect={vi.fn()} />);
    expect(screen.queryByRole("progressbar")).toBeNull();

    act(() => calendar.loading?.(true));
    expect(
      screen.getByRole("progressbar", { name: "Cargando eventos" }),
    ).toBeTruthy();

    act(() => calendar.loading?.(false));
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("asks for the events again only when the key changes, as after adding one", () => {
    const { rerender } = render(
      <Calendar organizationId="n1" onSelect={vi.fn()} refreshKey={0} />,
    );
    expect(calendar.refetchEvents).not.toHaveBeenCalled();

    rerender(
      <Calendar organizationId="n1" onSelect={vi.fn()} refreshKey={0} />,
    );
    expect(calendar.refetchEvents).not.toHaveBeenCalled();

    rerender(
      <Calendar organizationId="n1" onSelect={vi.fn()} refreshKey={1} />,
    );
    expect(calendar.refetchEvents).toHaveBeenCalledOnce();
  });
});
