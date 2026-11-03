import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProgramCalendar } from "./ProgramCalendar";

type Info = {
  event: { id: string; start: Date | null; end: Date | null };
  revert: () => void;
};
type Props = {
  editable: boolean;
  events: { id: string; title: string; classNames: string[] }[];
  headerToolbar: unknown;
  validRange: { start: Date; end: Date };
  eventClick: (info: Info) => void;
  eventDrop: (info: Info) => Promise<void>;
  eventResize: (info: Info) => Promise<void>;
};

const fc = vi.hoisted(() => ({
  props: undefined as unknown,
  push: vi.fn(),
}));
vi.mock("@fullcalendar/react", () => ({
  default: (props: unknown) => {
    fc.props = props;
    return null;
  },
}));
vi.mock("@fullcalendar/interaction", () => ({ default: {} }));
vi.mock("@fullcalendar/timegrid", () => ({ default: {} }));
vi.mock("@fullcalendar/list", () => ({ default: {} }));
vi.mock("@fullcalendar/core/locales/es", () => ({ default: {} }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: fc.push }) }));

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
  render(
    <ProgramCalendar
      nodeId="n1"
      start={new Date(2026, 9, 23, 8)}
      end={new Date(2026, 9, 25, 22)}
      items={items}
      canMove={canMove}
      onMove={onMove}
    />,
  );
  return { props: fc.props as Props, onMove };
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

  it("opens the sub-event when clicked", () => {
    const { props } = setup(true);

    props.eventClick({
      event: { id: "c1", start: null, end: null },
      revert: vi.fn(),
    });

    expect(fc.push).toHaveBeenCalledWith("/portal/n1/event/c1/attendance");
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
