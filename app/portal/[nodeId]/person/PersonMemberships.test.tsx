import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { PersonMemberships } from "./PersonMemberships";

const api = vi.hoisted(() => ({
  memberships: undefined as unknown,
  put: vi.fn(),
  mutate: vi.fn(),
  deletePeopleById: vi.fn(),
}));
vi.mock("@/app/(api)/generated", () => ({
  useGetPeopleByIdMemberships: () => ({
    data: api.memberships,
    mutate: api.mutate,
  }),
  useGetMeOrganizations: () => ({
    data: [
      { id: "c1", name: "Iglesia", type: "CHURCH", accessible: true },
      {
        id: "l1",
        name: "Sede",
        type: "LOCATION",
        parentId: "c1",
        accessible: true,
      },
      {
        id: "g1",
        name: "Jóvenes",
        type: "GROUP",
        parentId: "l1",
        accessible: true,
      },
      {
        id: "g2",
        name: "Alabanza",
        type: "MINISTRY",
        parentId: "l1",
        accessible: true,
      },
    ],
  }),
  putPeopleByIdMembershipsByOrganizationId: api.put,
  deletePeopleById: api.deletePeopleById,
}));

const showMessage = vi.fn();

const renderIt = () =>
  render(
    <SnackbarContext.Provider value={{ message: "", showMessage }}>
      <PersonMemberships personId="p1" personName="Ana Diaz" nodeId="l1" />
    </SnackbarContext.Provider>,
  );

describe("PersonMemberships", () => {
  beforeEach(() => {
    api.memberships = [
      {
        organizationId: "l1",
        organizationName: "Sede",
        organizationType: "LOCATION",
        memberState: "MEMBER",
        leader: false,
        positions: ["Pastor"],
      },
      {
        organizationId: "g1",
        organizationName: "Jóvenes",
        organizationType: "GROUP",
        memberState: "MEMBERSHIP_IN_PROGRESS",
        leader: false,
        positions: [],
      },
    ];
    api.put.mockReset().mockResolvedValue(undefined);
    api.mutate.mockReset().mockResolvedValue(undefined);
    api.deletePeopleById.mockReset().mockResolvedValue(undefined);
    showMessage.mockReset();
  });
  afterEach(cleanup);

  it("lists where the person is, with the state in each place and their positions", () => {
    renderIt();

    const list = screen.getByRole("list", { name: "Lugares de la persona" });
    expect(within(list).getAllByText("Sede")).toHaveLength(2); // name and type
    expect(within(list).getByText("Pastor")).toBeVisible();
    expect(within(list).getByText("Jóvenes")).toBeVisible();
    expect(
      screen.getByRole("combobox", { name: "Estado en Jóvenes" }).textContent,
    ).toBe("Asistente");
    // The node being viewed is edited in the form above, not here.
    expect(
      screen.queryByRole("combobox", { name: "Estado en Sede" }),
    ).toBeNull();
    expect(screen.getByText(/Miembro · se cambia arriba/)).toBeVisible();
  });

  it("changes the state in another place and refreshes the list", async () => {
    const user = userEvent.setup();
    renderIt();

    await user.click(
      screen.getByRole("combobox", { name: "Estado en Jóvenes" }),
    );
    await user.click(screen.getByRole("option", { name: "Miembro" }));

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("p1", "g1", {
        memberState: "MEMBER",
        leader: false,
      }),
    );
    expect(api.mutate).toHaveBeenCalled();
    expect(showMessage).toHaveBeenCalledWith("Guardado exitosamente");
  });

  it("makes the person a leader of a group", async () => {
    const user = userEvent.setup();
    renderIt();

    await user.click(screen.getByRole("checkbox", { name: "Líder" }));

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("p1", "g1", {
        memberState: "MEMBERSHIP_IN_PROGRESS",
        leader: true,
      }),
    );
  });

  it("removes the person from a place after confirming", async () => {
    const user = userEvent.setup();
    renderIt();

    await user.click(screen.getByRole("button", { name: "Quitar de Jóvenes" }));
    await user.click(await screen.findByRole("button", { name: "Quitar" }));

    await waitFor(() =>
      expect(api.deletePeopleById).toHaveBeenCalledWith("p1", {
        organizationId: "g1",
      }),
    );
    expect(api.mutate).toHaveBeenCalled();
  });

  it("offers only the places of the church where they are not yet", async () => {
    const user = userEvent.setup();
    renderIt();

    await user.click(
      screen.getByRole("combobox", {
        name: "Agregar a una sede, grupo o ministerio",
      }),
    );

    expect(screen.getByRole("option", { name: "Iglesia" })).toBeVisible();
    expect(screen.getByRole("option", { name: "Alabanza" })).toBeVisible();
    expect(screen.queryByRole("option", { name: "Jóvenes" })).toBeNull();
    expect(screen.queryByRole("option", { name: "Sede" })).toBeNull();
  });

  it("adds them to a place with the state chosen there", async () => {
    const user = userEvent.setup();
    renderIt();

    await user.click(
      screen.getByRole("combobox", {
        name: "Agregar a una sede, grupo o ministerio",
      }),
    );
    await user.click(screen.getByRole("option", { name: "Alabanza" }));
    await user.click(await screen.findByRole("button", { name: "Agregar" }));

    await waitFor(() =>
      expect(api.put).toHaveBeenCalledWith("p1", "g2", {
        memberState: "VISITOR",
        leader: false,
      }),
    );
    expect(api.mutate).toHaveBeenCalled();
  });
});
