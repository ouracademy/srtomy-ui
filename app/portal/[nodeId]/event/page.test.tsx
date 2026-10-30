import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EventListPage from "./page";

const api = vi.hoisted(() => ({
  postEvents: vi.fn(),
  putEventsByIdRegistration: vi.fn(),
  push: vi.fn(),
  // What the user picks on the calendar.
  selection: {
    start: new Date(2026, 9, 23, 18, 0),
    end: new Date(2026, 9, 23, 20, 0),
    allDay: false,
  },
}));

vi.mock("@/app/(api)/generated", () => ({
  postEvents: (...args: unknown[]) => api.postEvents(...args),
  putEventsByIdRegistration: (...args: unknown[]) =>
    api.putEventsByIdRegistration(...args),
  useGetOrganizationsById: () => ({ data: undefined }),
  useGetPeople: () => ({ data: undefined }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: api.push }) }));
vi.mock("@/app/(hooks)/usePermissions", () => ({
  usePermissions: () => ({ can: () => false }),
}));
// The real calendar is heavy and has its own tests: this one only picks days.
vi.mock("next/dynamic", () => ({
  default: () =>
    function CalendarStub({
      onSelect,
    }: {
      onSelect: (selection: object) => void;
    }) {
      return (
        <button onClick={() => onSelect({ ...api.selection, jsEvent: null })}>
          Elegir fechas
        </button>
      );
    },
}));

beforeEach(() => {
  api.postEvents.mockReset().mockResolvedValue("e1");
  api.push.mockReset();
});
afterEach(cleanup);

// The page reads its params with React.use, which waits for the promise.
const renderPage = async () => {
  const params = Promise.resolve({ nodeId: "n1" });
  await act(async () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <EventListPage params={params} />
      </LocalizationProvider>,
    );
  });
};

const createEvent = async (title: string) => {
  const user = userEvent.setup();
  await renderPage();
  await user.click(
    await screen.findByRole("button", { name: "Elegir fechas" }),
  );
  await user.type(await screen.findByPlaceholderText("Agregar título"), title);
  return user;
};

describe("EventListPage", () => {
  it("opens an event that lasts days on its own screen after saving it", async () => {
    // Friday evening to Sunday noon.
    api.selection = {
      start: new Date(2026, 9, 23, 18, 0),
      end: new Date(2026, 9, 25, 12, 0),
      allDay: false,
    };
    const user = await createEvent("Congreso");
    expect(
      await screen.findByRole("group", { name: "Hasta" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(api.postEvents).toHaveBeenCalledOnce());
    const request = api.postEvents.mock.calls[0]?.[0];
    expect(request.startTime).toMatch(/^2026-10-23T18:00:00/);
    expect(request.endTime).toMatch(/^2026-10-25T12:00:00/);
    expect(request.recurrence).toBeUndefined();
    await waitFor(() =>
      expect(api.push).toHaveBeenCalledWith("/portal/n1/event/e1/attendance"),
    );
  });

  it("starts an event that lasts days from the days picked in the all-day row", async () => {
    api.selection = {
      start: new Date(2026, 9, 23),
      end: new Date(2026, 9, 26),
      allDay: true,
    };
    await createEvent("Retiro");

    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(api.postEvents).toHaveBeenCalledOnce());
    const request = api.postEvents.mock.calls[0]?.[0];
    expect(request.startTime).toMatch(/^2026-10-23T09:00:00/);
    expect(request.endTime).toMatch(/^2026-10-25T13:00:00/);
  });

  it("opens an event of one day on its own screen too", async () => {
    api.selection = {
      start: new Date(2026, 9, 23, 18, 0),
      end: new Date(2026, 9, 23, 20, 0),
      allDay: false,
    };
    const user = await createEvent("Culto");

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(api.postEvents).toHaveBeenCalledOnce());
    const request = api.postEvents.mock.calls[0]?.[0];
    expect(request.startTime).toMatch(/^2026-10-23T18:00:00/);
    expect(request.endTime).toMatch(/^2026-10-23T20:00:00/);
    await waitFor(() =>
      expect(api.push).toHaveBeenCalledWith("/portal/n1/event/e1/attendance"),
    );
  });
});
