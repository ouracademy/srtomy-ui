import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PersonTable } from "./PersonTable";

const api = vi.hoisted(() => ({
  deletePeopleById: vi.fn(),
  mutate: vi.fn(),
  canDelete: true,
}));
vi.mock("@/app/(api)/generated", () => ({
  useGetPeople: () => ({
    data: {
      content: [{ id: "p1", fullName: "Ana Diaz" }],
      totalElements: 1,
    },
    isLoading: false,
    mutate: api.mutate,
  }),
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
  useSearchParams: () => new URLSearchParams(),
}));

describe("PersonTable", () => {
  beforeEach(() => {
    api.deletePeopleById.mockReset().mockResolvedValue(undefined);
    api.mutate.mockReset();
    api.canDelete = true;
  });
  afterEach(cleanup);

  it("removes a person from the node after confirming, and refreshes the list", async () => {
    const user = userEvent.setup();
    render(<PersonTable nodeId="n1" />);

    await user.click(await screen.findByRole("menuitem", { name: "Eliminar" }));
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
      screen.queryByRole("menuitem", { name: "Eliminar" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Ver" })).toBeInTheDocument();
  });
});
