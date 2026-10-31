import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GrowthDashboard } from "./GrowthDashboard";
import { toApiDate } from "./dateRange";

const hooks = vi.hoisted(() => ({
  useGetOrganizationsById: vi.fn(),
  useGetOrganizationsByIdGrowthRange: vi.fn(),
  useGetOrganizationsByIdAttendanceStats: vi.fn(),
  useGetOrganizationsByIdChilds: vi.fn(),
  useGetMePermissions: vi.fn(),
}));
vi.mock("@/app/(api)/generated", () => hooks);

const ok = (data: unknown) => ({ data, error: undefined, isLoading: false });
const today = () => toApiDate(new Date());

const growthRange = {
  current: { visitors: 4, attendees: 3, members: 10, total: 17 },
  buckets: [
    {
      periodStart: "2026-10-24",
      periodEnd: "2026-10-24",
      label: "2026-10-24",
      joined: 2,
      becameAttendee: 1,
      becameMember: 1,
      left: 0,
      peopleAtEnd: 15,
      membersAtEnd: 9,
    },
    {
      periodStart: "2026-10-30",
      periodEnd: "2026-10-30",
      label: "2026-10-30",
      joined: 3,
      becameAttendee: 0,
      becameMember: 1,
      left: 1,
      peopleAtEnd: 17,
      membersAtEnd: 10,
    },
  ],
};

const previousGrowthRange = {
  current: { visitors: 4, attendees: 3, members: 10, total: 17 },
  buckets: [
    {
      periodStart: "2026-10-17",
      periodEnd: "2026-10-17",
      label: "2026-10-17",
      joined: 1,
      becameAttendee: 0,
      becameMember: 0,
      left: 0,
      peopleAtEnd: 12,
      membersAtEnd: 8,
    },
  ],
};

const attendanceStats = {
  buckets: [
    {
      eventsCount: 2,
      attendanceMarks: 30,
      uniqueAttendees: 25,
      averagePerEvent: 15,
    },
  ],
};

const previousAttendanceStats = {
  buckets: [
    {
      eventsCount: 1,
      attendanceMarks: 10,
      uniqueAttendees: 8,
      averagePerEvent: 10,
    },
  ],
};

beforeEach(() => {
  hooks.useGetOrganizationsById.mockReturnValue(ok({ name: "Iglesia Vida" }));
  hooks.useGetOrganizationsByIdGrowthRange.mockImplementation(
    (_id: string, params: { endDate: string }) =>
      ok(params.endDate === today() ? growthRange : previousGrowthRange),
  );
  hooks.useGetOrganizationsByIdAttendanceStats.mockImplementation(
    (_id: string, params: { endDate: string }) =>
      ok(
        params.endDate === today() ? attendanceStats : previousAttendanceStats,
      ),
  );
  hooks.useGetOrganizationsByIdChilds.mockReturnValue(ok([]));
  hooks.useGetMePermissions.mockReturnValue(
    ok(["members.read", "events.read"]),
  );
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("GrowthDashboard", () => {
  it("shows the node, the current snapshot and the period totals", () => {
    render(<GrowthDashboard nodeId="n1" />);

    expect(
      screen.getByRole("heading", { name: "Resumen de Iglesia Vida" }),
    ).toBeTruthy();
    expect(
      screen.getByText("Visitantes", { selector: "p" }).previousSibling
        ?.textContent,
    ).toBe("4");
    expect(
      screen.getByText("Miembros", { selector: "p" }).previousSibling
        ?.textContent,
    ).toBe("10");
    expect(
      screen.getByText("Total de personas").previousSibling?.textContent,
    ).toBe("17");
    // joined: 2 + 3 = 5 this period, vs. 1 the previous period -> +400%
    expect(
      screen.getByText("Nuevas personas").previousSibling?.textContent,
    ).toBe("5");
    expect(screen.getByText("400% vs. período anterior")).toBeTruthy();
    expect(
      screen.getByText("Eventos realizados").previousSibling?.textContent,
    ).toBe("2");
    expect(
      screen.getByText("Asistencia total").previousSibling?.textContent,
    ).toBe("30");
  });

  it("changes the range when a preset is clicked", async () => {
    const user = userEvent.setup();
    render(<GrowthDashboard nodeId="n1" />);
    const currentRangeCalls = () =>
      hooks.useGetOrganizationsByIdGrowthRange.mock.calls.filter(
        ([, params]) => params.endDate === today(),
      );
    const firstStart = currentRangeCalls().at(-1)?.[1].startDate;

    await user.click(screen.getByRole("button", { name: "Último mes" }));

    const lastStart = currentRangeCalls().at(-1)?.[1].startDate;
    expect(lastStart).not.toBe(firstStart);
  });

  it("hides event-dependent cards and the attendance chart without events.read", () => {
    hooks.useGetMePermissions.mockReturnValue(ok(["members.read"]));
    render(<GrowthDashboard nodeId="n1" />);

    expect(screen.queryByText("Eventos realizados")).toBeNull();
    expect(screen.queryByText("Asistencia total")).toBeNull();
    expect(screen.queryByText("Eventos y asistencia")).toBeNull();
  });

  it("opens the table with the numbers of each period", async () => {
    const user = userEvent.setup();
    render(<GrowthDashboard nodeId="n1" />);
    expect(screen.queryByRole("table")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Ver tabla" }));

    expect(
      screen.getByRole("table", { name: "Detalle por período" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("rowheader", { name: "30 de octubre de 2026" }),
    ).toBeTruthy();
  });

  it("invites to add the first person when there is nobody", () => {
    hooks.useGetOrganizationsByIdGrowthRange.mockReturnValue(
      ok({
        current: { total: 0 },
        buckets: [{ label: "2026-10-30", joined: 0 }],
      }),
    );
    render(<GrowthDashboard nodeId="n1" />);

    expect(
      screen
        .getByRole("link", { name: "Agregar persona" })
        .getAttribute("href"),
    ).toBe("/portal/n1/person/create");
  });

  it("shows a loading state", () => {
    hooks.useGetOrganizationsByIdGrowthRange.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });
    render(<GrowthDashboard nodeId="n1" />);
    expect(screen.queryByRole("heading")).toBeNull();
  });
});
