import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AttendanceEvent from "./page";

const api = vi.hoisted(() => ({
  event: undefined as unknown,
  sharing: undefined as unknown,
  summary: undefined as unknown,
  deleteEventsById: vi.fn(),
  push: vi.fn(),
  allowed: ["events.write"] as string[],
}));
vi.mock("@/app/(api)/generated", () => ({
  deleteEventsById: (...args: unknown[]) => api.deleteEventsById(...args),
  useGetEventsById: () => ({
    data: api.event,
    isLoading: false,
    error: undefined,
    mutate: vi.fn(),
  }),
  useGetEventsByIdSharing: () => ({ data: api.sharing }),
  useGetEventsByIdAttendanceSummary: () => ({ data: api.summary }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: api.push }) }));
vi.mock("@/app/(hooks)/usePermissions", () => ({
  usePermissions: () => ({
    can: (permission: string) => api.allowed.includes(permission),
  }),
}));
vi.mock("./DetailTab", () => ({
  DetailTab: () => <div data-testid="detail" />,
}));
vi.mock("./AttendanceTab", () => ({
  AttendanceTab: () => <div data-testid="attendance" />,
}));
vi.mock("./ShareEventButton", () => ({
  ShareEventButton: () => <button type="button">Compartir</button>,
}));
vi.mock("./EditableEventForm", () => ({
  EditableEventForm: () => <div data-testid="form">Formulario</div>,
}));

beforeEach(() => {
  api.deleteEventsById.mockReset();
  api.push.mockReset();
  api.allowed = ["events.write"];
  api.sharing = { generalAccess: "ANYONE_WITH_LINK" };
  api.summary = { total: 87 };
  api.event = {
    id: "e1",
    title: "Congreso Avivamiento 2026",
    start: new Date(2026, 10, 13, 9),
    end: new Date(2026, 10, 15, 20),
    address: "Sede Central",
    children: [{ id: "c1", title: "Taller" }],
  } satisfies EventResponse;
});
afterEach(cleanup);

const renderPage = async () => {
  const params = Promise.resolve({ id: "e1", nodeId: "n1" });
  await act(async () => {
    render(<AttendanceEvent params={params} />);
  });
  return userEvent.setup();
};

describe("AttendanceEvent", () => {
  it("shows the header and the detail first, with the number of people who came on its tab", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", { name: "Congreso Avivamiento 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cualquiera con el enlace")).toBeInTheDocument();
    expect(screen.getByTestId("detail")).toBeInTheDocument();
    expect(screen.queryByTestId("attendance")).toBeNull();
    expect(screen.getByRole("tab", { name: /Asistencia/ })).toHaveTextContent(
      "87",
    );
  });

  it("moves between the detail and the attendance", async () => {
    const user = await renderPage();

    await user.click(screen.getByRole("tab", { name: /Asistencia/ }));
    expect(screen.getByTestId("attendance")).toBeInTheDocument();
    expect(screen.queryByTestId("detail")).toBeNull();

    await user.click(screen.getByRole("tab", { name: "Detalle" }));
    expect(screen.getByTestId("detail")).toBeInTheDocument();
  });

  it("edits the event in a dialog", async () => {
    const user = await renderPage();

    await user.click(screen.getByRole("button", { name: "Editar" }));

    expect(screen.getByRole("dialog")).toContainElement(
      screen.getByTestId("form"),
    );
  });

  it("deletes the event after asking, warning about its sub-events", async () => {
    api.deleteEventsById.mockResolvedValue(undefined);
    const user = await renderPage();

    await user.click(screen.getByRole("button", { name: "Más acciones" }));
    await user.click(await screen.findByRole("menuitem", { name: "Eliminar" }));
    expect(
      screen.getByText(/También se eliminará su sub-evento/),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(api.deleteEventsById).toHaveBeenCalledWith("e1", {
      option: "THIS_EVENT",
    });
    await vi.waitFor(() =>
      expect(api.push).toHaveBeenCalledWith("/portal/n1/event"),
    );
  });

  it("offers no edit, share or delete to someone who cannot write", async () => {
    api.allowed = [];
    api.sharing = undefined;
    await renderPage();

    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Compartir" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Más acciones" })).toBeNull();
  });
});
