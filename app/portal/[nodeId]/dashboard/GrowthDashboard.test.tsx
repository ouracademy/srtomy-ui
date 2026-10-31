import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GrowthDashboard } from "./GrowthDashboard";

const hooks = vi.hoisted(() => ({
  useGetOrganizationsById: vi.fn(),
  useGetOrganizationsByIdGrowth: vi.fn(),
}));
vi.mock("@/app/(api)/generated", () => hooks);

const growth = {
  current: { visitors: 4, attendees: 3, members: 10, total: 17 },
  months: [
    {
      month: "2026-09",
      joined: 2,
      becameAttendee: 1,
      becameMember: 1,
      left: 0,
      peopleAtEnd: 15,
      membersAtEnd: 9,
    },
    {
      month: "2026-10",
      joined: 3,
      becameAttendee: 0,
      becameMember: 1,
      left: 1,
      peopleAtEnd: 17,
      membersAtEnd: 10,
    },
  ],
};

const ok = (data: unknown) => ({ data, error: undefined, isLoading: false });

beforeEach(() => {
  hooks.useGetOrganizationsById.mockReturnValue(ok({ name: "Iglesia Vida" }));
  hooks.useGetOrganizationsByIdGrowth.mockReturnValue(ok(growth));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("GrowthDashboard", () => {
  it("shows the node, the counts and the summary", () => {
    render(<GrowthDashboard nodeId="n1" />);

    expect(
      screen.getByRole("heading", { name: "Resumen de Iglesia Vida" }),
    ).toBeTruthy();
    expect(screen.getByText("Visitantes").previousSibling?.textContent).toBe(
      "4",
    );
    expect(
      screen.getByText("Miembros", { selector: "p" }).previousSibling
        ?.textContent,
    ).toBe("10");
    expect(
      screen.getByText("Total de personas").previousSibling?.textContent,
    ).toBe("17");
    expect(
      screen.getByText(
        "En los últimos 2 meses se sumaron 5 personas, 2 pasaron a ser miembros y 1 salió.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("img", { name: /Personas al terminar cada mes/ }),
    ).toBeTruthy();
  });

  it("asks for 12 months and changes the range", async () => {
    const user = userEvent.setup();
    render(<GrowthDashboard nodeId="n1" />);
    expect(hooks.useGetOrganizationsByIdGrowth).toHaveBeenLastCalledWith("n1", {
      months: 12,
    });

    await user.click(screen.getByRole("button", { name: "Últimos 24 meses" }));

    expect(hooks.useGetOrganizationsByIdGrowth).toHaveBeenLastCalledWith("n1", {
      months: 24,
    });
  });

  it("opens the table with the numbers of each month", async () => {
    const user = userEvent.setup();
    render(<GrowthDashboard nodeId="n1" />);
    expect(screen.queryByRole("table")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Ver tabla" }));

    expect(
      screen.getByRole("table", { name: "Movimiento mes a mes" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("rowheader", { name: "octubre de 2026" }),
    ).toBeTruthy();
  });

  it("invites to add the first person when there is nobody", () => {
    hooks.useGetOrganizationsByIdGrowth.mockReturnValue(
      ok({ current: { total: 0 }, months: [{ month: "2026-10", joined: 0 }] }),
    );
    render(<GrowthDashboard nodeId="n1" />);

    expect(
      screen
        .getByRole("link", { name: "Agregar persona" })
        .getAttribute("href"),
    ).toBe("/portal/n1/person/create");
  });

  it("shows a loading state", () => {
    hooks.useGetOrganizationsByIdGrowth.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
    });
    render(<GrowthDashboard nodeId="n1" />);
    expect(screen.queryByRole("heading")).toBeNull();
  });
});
