import { cleanup, render, screen, within } from "@testing-library/react";
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

    const section = screen.getByRole("region", {
      name: "Total de asistentes",
    });
    expect(within(section).getByText("Asistieron")).toBeInTheDocument();
    expect(within(section).getByText("23")).toBeInTheDocument();
    expect(
      within(section).getByText("Cada persona cuenta una sola vez."),
    ).toBeInTheDocument();
    expect(screen.getByText("En la lista: 18")).toBeInTheDocument();
    expect(screen.getByText("Solo con ticket: 2")).toBeInTheDocument();
    expect(screen.getByText("Visitantes: 3")).toBeInTheDocument();
  });

  it("says how many were expected when the event has a sign-up", () => {
    api.data = { people: 5, ticketOnly: 0, guests: 0, total: 5 };
    render(<AttendanceTotal eventId="e1" expected={120} />);

    expect(screen.getByText("de 120 esperados")).toBeInTheDocument();
  });

  it("does not say how many were expected without a sign-up", () => {
    api.data = { people: 5, ticketOnly: 0, guests: 0, total: 5 };
    render(<AttendanceTotal eventId="e1" />);

    expect(screen.queryByText(/esperados/)).toBeNull();
  });

  it("uses the singular for one person", () => {
    api.data = { people: 1, ticketOnly: 0, guests: 0, total: 1 };
    render(<AttendanceTotal eventId="e1" />);

    expect(screen.getByText("Asistió")).toBeInTheDocument();
  });

  it("shows zero before anyone came", () => {
    api.data = { people: 0, ticketOnly: 0, guests: 0, total: 0 };
    render(<AttendanceTotal eventId="e1" />);

    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Visitantes: 0")).toBeInTheDocument();
  });

  it("shows nothing until the numbers arrive", () => {
    api.data = undefined;
    const { container } = render(<AttendanceTotal eventId="e1" />);

    expect(container).toBeEmptyDOMElement();
  });
});
