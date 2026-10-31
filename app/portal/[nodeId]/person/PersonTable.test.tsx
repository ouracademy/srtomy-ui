import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PersonTable } from "./PersonTable";

const api = vi.hoisted(() => ({
  deletePeopleById: vi.fn(),
  mutate: vi.fn(),
  canDelete: true,
  search: "",
  people: undefined as unknown,
  asked: [] as unknown[],
}));
vi.mock("@/app/(api)/generated", () => ({
  useGetPeople: (params: unknown) => {
    api.asked.push(params);
    return {
      data: api.people ?? {
        content: [{ id: "p1", fullName: "Ana Diaz" }],
        totalElements: 1,
      },
      isLoading: false,
      mutate: api.mutate,
    };
  },
  useGetOrganizationsById: () => ({ data: { type: "GROUP" } }),
  deletePeopleById: api.deletePeopleById,
}));
vi.mock("@/app/(hooks)/usePermissions", () => ({
  usePermissions: () => ({
    can: (permission: string) =>
      permission === "members.delete" ? api.canDelete : true,
  }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(api.search),
}));

describe("PersonTable", () => {
  beforeEach(() => {
    api.deletePeopleById.mockReset().mockResolvedValue(undefined);
    api.mutate.mockReset();
    api.canDelete = true;
    api.search = "";
    api.people = undefined;
    api.asked = [];
  });
  afterEach(cleanup);

  it("removes a person from the node after confirming, and refreshes the list", async () => {
    const user = userEvent.setup();
    render(<PersonTable nodeId="n1" />);

    await user.click(await screen.findByRole("button", { name: "Eliminar" }));
    expect(screen.getByText("Quitar a Ana Diaz de este grupo")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Quitar" }));

    await waitFor(() => expect(api.mutate).toHaveBeenCalledOnce());
    expect(api.deletePeopleById).toHaveBeenCalledWith("p1", {
      organizationId: "n1",
    });
  });

  it("does not offer to delete without the permission", async () => {
    api.canDelete = false;
    render(<PersonTable nodeId="n1" />);

    expect(await screen.findByText("Ana Diaz")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Eliminar" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver" })).toBeInTheDocument();
  });

  it("shows the state of each person in the node", async () => {
    api.people = {
      content: [
        { id: "p1", fullName: "Ana Diaz", memberState: "MEMBER" },
        {
          id: "p2",
          fullName: "Beto Ruiz",
          memberState: "MEMBERSHIP_IN_PROGRESS",
        },
      ],
      totalElements: 2,
    };
    render(<PersonTable nodeId="n1" />);

    expect(await screen.findByText("Miembro")).toBeVisible();
    expect(screen.getByText("Asistente")).toBeVisible();
  });

  it("asks only for the people in the state of the url", () => {
    api.search = "estado=MEMBERSHIP_IN_PROGRESS&search=ana";
    render(<PersonTable nodeId="n1" />);

    expect(api.asked.at(-1)).toMatchObject({
      organizationId: "n1",
      searchText: "ana",
      memberState: "MEMBERSHIP_IN_PROGRESS",
    });
  });

  it("ignores a state in the url that does not exist", () => {
    api.search = "estado=nope";
    render(<PersonTable nodeId="n1" />);

    expect(api.asked.at(-1)).toMatchObject({ memberState: undefined });
  });
});
