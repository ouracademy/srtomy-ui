import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AttendanceList } from "./AttendanceList";

const api = vi.hoisted(() => ({ people: vi.fn() }));
vi.mock("@/app/(api)/generated", () => ({
  useGetPeople: (params: unknown) => api.people(params),
}));

const people = {
  content: [
    { id: "p1", fullName: "Ana Paz" },
    { id: "p2", fullName: "Tomás Quispe" },
    { id: "p3", fullName: "Luis Mora" },
  ],
  totalElements: 3,
};

beforeEach(() => {
  api.people.mockReset();
  api.people.mockReturnValue({ data: people, isLoading: false });
});
afterEach(cleanup);

const marks = [
  { personId: "p1", source: "MANUAL", markedAt: new Date(2026, 10, 14, 9, 2) },
  {
    personId: "p2",
    source: "QR_TICKET",
    markedAt: new Date(2026, 10, 14, 9, 5),
  },
] as const;

const setup = (canTake = true) => {
  const onSave = vi.fn(() => Promise.resolve());
  render(
    <AttendanceList
      nodeId="n1"
      marks={marks}
      canTake={canTake}
      onSave={onSave}
    />,
  );
  return { onSave, user: userEvent.setup() };
};

const rowOf = (name: string) =>
  screen.getByRole("row", { name: new RegExp(name) });

describe("AttendanceList", () => {
  it("shows how each person came in, and who has not come yet", () => {
    setup();

    expect(within(rowOf("Ana Paz")).getByText("En la lista")).toBeVisible();
    expect(within(rowOf("Tomás")).getByText("Con ticket")).toBeVisible();
    expect(within(rowOf("Luis Mora")).getByText("Aún no")).toBeVisible();
    expect(within(rowOf("Luis Mora")).getByText("Sin hora")).toBeVisible();
  });

  it("marks someone who has not come, keeping the others", async () => {
    const { onSave, user } = setup();

    await user.click(
      screen.getByRole("button", { name: "Marcar ingreso de Luis Mora" }),
    );

    expect(onSave).toHaveBeenCalledWith(["p1", "p2", "p3"]);
  });

  it("takes out someone who was marked", async () => {
    const { onSave, user } = setup();

    await user.click(screen.getByRole("button", { name: "Quitar Ana Paz" }));

    expect(onSave).toHaveBeenCalledWith(["p2"]);
  });

  it("has no buttons for who cannot take attendance", () => {
    setup(false);

    expect(screen.queryByRole("button", { name: /Quitar|Marcar/ })).toBeNull();
    expect(within(rowOf("Ana Paz")).getByText("En la lista")).toBeVisible();
  });

  it("searches by name after the user stops typing", async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText("Buscar persona"), "Lu");

    await vi.waitFor(() =>
      expect(api.people).toHaveBeenLastCalledWith(
        expect.objectContaining({ searchText: "Lu", page: 0 }),
      ),
    );
  });

  it("says when nobody has that name", () => {
    api.people.mockReturnValue({
      data: { content: [], totalElements: 0 },
      isLoading: false,
    });
    setup();

    expect(screen.getByText("Aún no hay personas.")).toBeInTheDocument();
  });
});
