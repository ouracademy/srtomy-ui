import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AttendanceTab } from "./AttendanceTab";

const api = vi.hoisted(() => ({
  put: vi.fn(),
  mutate: vi.fn(),
  attendance: { personIds: ["p1"], guestCount: 3 } as unknown,
}));
vi.mock("@/app/(api)/generated", () => ({
  putEventsByIdAttendance: (...args: unknown[]) => api.put(...args),
  useGetEventsByIdAttendance: () => ({
    data: api.attendance,
    isLoading: false,
    mutate: api.mutate,
  }),
}));
vi.mock("./AttendanceTotal", () => ({
  AttendanceTotal: () => <div data-testid="total" />,
}));
vi.mock("./AttendanceTools", () => ({
  AttendanceTools: ({ guestCount }: { guestCount: number }) => (
    <div data-testid="tools">{guestCount} visitantes</div>
  ),
}));
vi.mock("../../../person/PersonTable", () => ({
  PersonTable: () => <div data-testid="people" />,
}));

beforeEach(() => {
  api.put.mockReset();
  api.mutate.mockReset();
});
afterEach(cleanup);

const setup = (canTake = true) => {
  render(
    <AttendanceTab
      nodeId="n1"
      eventId="e1"
      event={{ id: "e1", title: "Congreso" }}
      canTake={canTake}
    />,
  );
  return userEvent.setup();
};

describe("AttendanceTab", () => {
  it("shows how many came, the tools of who takes attendance and the list", () => {
    setup();

    expect(screen.getByTestId("total")).toBeInTheDocument();
    expect(screen.getByTestId("tools")).toHaveTextContent("3 visitantes");
    expect(screen.getByTestId("people")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Lista de asistencia" }),
    ).toBeInTheDocument();
  });

  it("does not offer the tools to whoever cannot take attendance", () => {
    setup(false);

    expect(screen.queryByTestId("tools")).toBeNull();
    expect(screen.getByTestId("people")).toBeInTheDocument();
  });

  it("saves the attendance that was already saved when nothing was picked", async () => {
    api.put.mockResolvedValue(undefined);
    const user = setup();

    await user.click(
      screen.getByRole("button", { name: "Registrar asistencias" }),
    );

    expect(api.put).toHaveBeenCalledWith("e1", { personIds: ["p1"] });
  });
});
