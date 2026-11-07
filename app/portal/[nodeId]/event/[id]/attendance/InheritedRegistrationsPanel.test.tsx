import type { EventRegistrationResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InheritedRegistrationsPanel } from "./InheritedRegistrationsPanel";

const api = vi.hoisted(() => ({
  data: undefined as unknown,
  mutate: vi.fn(),
  put: vi.fn(),
}));
vi.mock("@/app/(api)/generated", () => ({
  useGetEventsByIdRegistrations: () => ({
    data: api.data,
    isLoading: false,
    mutate: api.mutate,
  }),
  putEventsByIdRegistrationsByRegistrationIdCheckIn: (...args: unknown[]) =>
    api.put(...args),
}));

beforeEach(() => {
  api.mutate.mockReset();
  api.put.mockReset();
});
afterEach(cleanup);

const registration = (
  overrides: Partial<EventRegistrationResponse>,
): EventRegistrationResponse => ({
  id: "r1",
  firstName: "Ana",
  lastName: "Paz",
  ticketName: "General",
  ...overrides,
});

const setup = (
  items: EventRegistrationResponse[],
  { canCheckIn = true } = {},
) => {
  api.data = items;
  render(<InheritedRegistrationsPanel eventId="e1" canCheckIn={canCheckIn} />);
  return userEvent.setup();
};

describe("InheritedRegistrationsPanel", () => {
  it("counts who is expected and who already came in", () => {
    setup([
      registration({ checkedInAt: new Date(2030, 0, 6, 10, 5) }),
      registration({ id: "r2", firstName: "Lu", lastName: "Mora" }),
    ]);

    expect(screen.getByText("Esperados: 2")).toBeInTheDocument();
    expect(screen.getByText("Ingresaron: 1")).toBeInTheDocument();
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]!).getByText(/Ingresó a las/)).toBeInTheDocument();
    expect(within(rows[2]!).getByText("Aún no")).toBeInTheDocument();
  });

  it("says so when nobody signed up to the event", () => {
    setup([]);

    expect(screen.getByText(/Aún no hay inscritos/)).toBeInTheDocument();
  });

  it("marks someone as in and reads the list again", async () => {
    api.put.mockResolvedValue({});
    const user = setup([registration({})]);

    await user.click(
      screen.getByRole("button", { name: "Marcar el ingreso de Ana Paz" }),
    );

    expect(api.put).toHaveBeenCalledWith("e1", "r1", { checkedIn: true });
    await vi.waitFor(() => expect(api.mutate).toHaveBeenCalled());
  });

  it("takes the mark back", async () => {
    api.put.mockResolvedValue({});
    const user = setup([registration({ checkedInAt: new Date() })]);

    await user.click(
      screen.getByRole("button", { name: "Quitar el ingreso de Ana Paz" }),
    );

    expect(api.put).toHaveBeenCalledWith("e1", "r1", { checkedIn: false });
  });

  it("keeps the list as it was when the change fails", async () => {
    api.put.mockRejectedValue(new Error("no"));
    const user = setup([registration({})]);

    await user.click(
      screen.getByRole("button", { name: "Marcar el ingreso de Ana Paz" }),
    );

    expect(api.mutate).not.toHaveBeenCalled();
  });

  it("only lets those who take attendance mark the entry", () => {
    setup([registration({})], { canCheckIn: false });

    expect(screen.queryByRole("button", { name: /ingreso de/ })).toBeNull();
  });
});
