import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AttendanceTab } from "./AttendanceTab";

const api = vi.hoisted(() => ({
  put: vi.fn(),
  mutate: vi.fn(),
  attendance: vi.fn(),
  registrations: vi.fn(),
  shown: vi.fn(),
}));
vi.mock("@/app/(api)/generated", () => ({
  putEventsByIdAttendance: (...args: unknown[]) => api.put(...args),
  useGetEventsByIdAttendance: (id: string) => api.attendance(id),
  useGetEventsByIdRegistrations: (id: string) => api.registrations(id),
}));
vi.mock("./AttendanceTotal", () => ({
  AttendanceTotal: ({
    eventId,
    expected,
  }: {
    eventId: string;
    expected?: number;
  }) => (
    <div data-testid="total">
      {eventId} {expected ?? "sin esperados"}
    </div>
  ),
}));
vi.mock("./AttendanceTools", () => ({
  AttendanceTools: ({
    eventId,
    title,
    guestCount,
  }: {
    eventId: string;
    title: string;
    guestCount: number;
  }) => (
    <div data-testid="tools">
      {eventId} {title} {guestCount} visitantes
    </div>
  ),
}));
vi.mock("./AttendanceList", () => ({
  AttendanceList: ({
    onSave,
  }: {
    onSave: (ids: string[]) => Promise<void>;
  }) => (
    <button type="button" onClick={() => void onSave(["p1", "p2"])}>
      guardar lista
    </button>
  ),
}));

beforeEach(() => {
  api.put.mockReset();
  api.mutate.mockReset();
  api.attendance.mockReturnValue({
    data: { marks: [], guestCount: 3 },
    isLoading: false,
    mutate: api.mutate,
  });
  api.registrations.mockReturnValue({ data: undefined });
});
afterEach(cleanup);

const setup = (
  props: {
    canTake?: boolean;
    children?: { id: string; title: string; start: Date }[];
  } = {},
) => {
  render(
    <AttendanceTab
      nodeId="n1"
      eventId="e1"
      event={{ id: "e1", title: "Congreso", children: props.children }}
      canTake={props.canTake ?? true}
    />,
  );
  return userEvent.setup();
};

describe("AttendanceTab", () => {
  it("shows how many came, the list and the tools of who takes attendance", () => {
    setup();

    expect(screen.getByTestId("total")).toHaveTextContent("e1 sin esperados");
    expect(screen.getByTestId("tools")).toHaveTextContent(
      "e1 Congreso 3 visitantes",
    );
    expect(
      screen.getByRole("button", { name: "guardar lista" }),
    ).toBeInTheDocument();
  });

  it("hides the tools from who cannot take attendance", () => {
    setup({ canTake: false });

    expect(screen.queryByTestId("tools")).toBeNull();
  });

  it("says how many are expected when people signed up", () => {
    api.registrations.mockReturnValue({
      data: [
        { status: "CONFIRMED" },
        { status: "CONFIRMED" },
        { status: "CANCELLED" },
      ],
    });
    setup();

    expect(screen.getByTestId("total")).toHaveTextContent("e1 2");
  });

  it("saves the list and refreshes it", async () => {
    api.put.mockResolvedValue(undefined);
    const user = setup();

    await user.click(screen.getByRole("button", { name: "guardar lista" }));

    expect(api.put).toHaveBeenCalledWith("e1", { personIds: ["p1", "p2"] });
    expect(api.mutate).toHaveBeenCalled();
  });

  it("shows the whole event as chosen at first", async () => {
    setup({
      children: [
        { id: "c1", title: "Apertura", start: new Date(2026, 10, 13, 9) },
      ],
    });

    expect(screen.getByLabelText("Asistencia de")).toHaveTextContent(
      "Todo el evento",
    );
  });

  it("has no session selector without a program", () => {
    setup();

    expect(screen.queryByLabelText("Asistencia de")).toBeNull();
  });

  it("takes the attendance of one session of the program", async () => {
    const user = setup({
      children: [
        { id: "c1", title: "Apertura", start: new Date(2026, 10, 13, 9) },
      ],
    });

    await user.click(screen.getByLabelText("Asistencia de"));
    await user.click(await screen.findByRole("option", { name: /Apertura/ }));

    expect(screen.getByTestId("total")).toHaveTextContent("c1");
    expect(screen.getByTestId("tools")).toHaveTextContent("c1 Apertura");
  });
});
