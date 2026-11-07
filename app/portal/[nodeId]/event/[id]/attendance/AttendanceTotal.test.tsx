import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AttendanceTotal } from "./AttendanceTotal";

const api = vi.hoisted(() => ({ data: undefined as unknown }));
vi.mock("@/app/(api)/generated", () => ({
  useGetEventsByIdAttendanceSummary: () => ({ data: api.data }),
}));

afterEach(cleanup);

describe("AttendanceTotal", () => {
  it("says how many came, each person once, and where they come from", () => {
    api.data = { people: 18, ticketOnly: 2, guests: 3, total: 23 };
    render(<AttendanceTotal eventId="e1" />);

    expect(screen.getByText("Asistieron 23 personas")).toBeInTheDocument();
    expect(screen.getByText("En la lista: 18")).toBeInTheDocument();
    expect(screen.getByText("Solo con ticket: 2")).toBeInTheDocument();
    expect(screen.getByText("Visitantes: 3")).toBeInTheDocument();
  });

  it("uses the singular for one person", () => {
    api.data = { people: 1, ticketOnly: 0, guests: 0, total: 1 };
    render(<AttendanceTotal eventId="e1" />);

    expect(screen.getByText("Asistió 1 persona")).toBeInTheDocument();
  });

  it("says nobody came yet, without the breakdown", () => {
    api.data = { people: 0, ticketOnly: 0, guests: 0, total: 0 };
    render(<AttendanceTotal eventId="e1" />);

    expect(screen.getByText("Aún no asistió nadie.")).toBeInTheDocument();
    expect(screen.queryByText(/En la lista/)).toBeNull();
  });

  it("shows nothing until the numbers arrive", () => {
    api.data = undefined;
    const { container } = render(<AttendanceTotal eventId="e1" />);

    expect(container).toBeEmptyDOMElement();
  });
});
