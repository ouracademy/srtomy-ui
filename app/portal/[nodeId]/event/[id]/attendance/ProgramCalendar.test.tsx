import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProgramCalendar } from "./ProgramCalendar";

type Info = {
  event: { id: string; start: Date | null; end: Date | null };
  revert: () => void;
};
type Click = {
  event: { id: string };
  el: HTMLElement;
  jsEvent: { preventDefault: () => void };
};
type Props = {
  editable: boolean;
  events: { id: string; title: string; classNames: string[] }[];
  headerToolbar: unknown;
  validRange: { start: Date; end: Date };
  selectable: boolean;
  slotMinTime: string;
  slotMaxTime: string;
  select: (info: { start: Date; end: Date }) => void;
  eventClick: (info: Click) => void;
  eventDrop: (info: Info) => Promise<void>;
  eventResize: (info: Info) => Promise<void>;
};

const fc = vi.hoisted(() => ({ props: undefined as unknown }));
vi.mock("@fullcalendar/react", () => ({
  default: (props: unknown) => {
    fc.props = props;
    return null;
  },
}));
vi.mock("@fullcalendar/react/interaction", () => ({ default: {} }));
vi.mock("@fullcalendar/react/timegrid", () => ({ default: {} }));
vi.mock("@fullcalendar/react/list", () => ({ default: {} }));
vi.mock("@fullcalendar/react/themes/classic", () => ({ default: {} }));
vi.mock("@fullcalendar/react/locales/es", () => ({ default: {} }));

afterEach(cleanup);

const items = [
  {
    id: "c1",
    title: "Taller",
    start: new Date(2026, 9, 23, 9),
    end: new Date(2026, 9, 23, 11),
    isACourse: true,
  },
];

const setup = (
  canMove: boolean,
  onMove = vi.fn().mockResolvedValue(undefined),
) => {
  const onCreate = vi.fn();
  const onPick = vi.fn();
  render(
    <ProgramCalendar
      start={new Date(2026, 9, 23, 8)}
      end={new Date(2026, 9, 25, 22)}
      items={items}
      canMove={canMove}
      onMove={onMove}
      onCreate={onCreate}
      onPick={onPick}
    />,
  );
  return { props: fc.props as Props, onMove, onCreate, onPick };
};

describe("ProgramCalendar", () => {
  it("shows the sub-events inside the days of the event only", () => {
    const { props } = setup(true);

    expect(props.events).toHaveLength(1);
    expect(props.events[0]?.classNames).toContain("fc-course");
    expect(props.validRange.start).toEqual(new Date(2026, 9, 23));
    expect(props.validRange.end).toEqual(new Date(2026, 9, 26));
    expect(props.headerToolbar).toBe(false);
  });

  it("hands over the session and its element when it is clicked, without following it", () => {
    const { props, onPick } = setup(true);
    const element = document.createElement("a");
    const preventDefault = vi.fn();

    props.eventClick({
      event: { id: "c1" },
      el: element,
      jsEvent: { preventDefault },
    });

    expect(preventDefault).toHaveBeenCalled();
    expect(onPick).toHaveBeenCalledWith("c1", element);
  });

  it("creates a session over the free hours that were dragged", () => {
    const { props, onCreate } = setup(true);
    const from = new Date(2026, 9, 24, 17);
    const to = new Date(2026, 9, 24, 18);

    props.select({ start: from, end: to });

    expect(props.selectable).toBe(true);
    expect(onCreate).toHaveBeenCalledWith(from, to);
  });

  it("does not let someone who cannot write select hours", () => {
    expect(setup(false).props.selectable).toBe(false);
  });

  it("shows the hours of the sessions, wider than the usual when one needs it", () => {
    const { props } = setup(true);

    expect(props.slotMinTime).toBe("07:00:00");
    expect(props.slotMaxTime).toBe("22:00:00");
  });

  it("can be dragged only by whoever may write", () => {
    expect(setup(true).props.editable).toBe(true);
    expect(setup(false).props.editable).toBe(false);
  });

  it("saves a drop and keeps the sub-event where it was dropped", async () => {
    const { props, onMove } = setup(true);
    const revert = vi.fn();
    const start = new Date(2026, 9, 24, 9);
    const end = new Date(2026, 9, 24, 11);

    await props.eventDrop({ event: { id: "c1", start, end }, revert });

    expect(onMove).toHaveBeenCalledWith("c1", start, end);
    expect(revert).not.toHaveBeenCalled();
  });

  it("puts the sub-event back when saving fails", async () => {
    const { props } = setup(true, vi.fn().mockRejectedValue(new Error("no")));
    const revert = vi.fn();

    await props.eventResize({
      event: { id: "c1", start: new Date(), end: new Date() },
      revert,
    });

    expect(revert).toHaveBeenCalled();
  });

  it("puts the sub-event back when it ends up with no hours", async () => {
    const { props, onMove } = setup(true);
    const revert = vi.fn();

    await props.eventDrop({
      event: { id: "c1", start: null, end: null },
      revert,
    });

    expect(onMove).not.toHaveBeenCalled();
    expect(revert).toHaveBeenCalled();
  });
});
