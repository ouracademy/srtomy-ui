import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DeletePersonButton } from "./DeletePersonButton";

const api = vi.hoisted(() => ({
  deletePeopleById: vi.fn(),
  canDelete: true,
}));
vi.mock("@/app/(api)/generated", () => ({
  useGetOrganizationsById: () => ({ data: { type: "CHURCH" } }),
  deletePeopleById: api.deletePeopleById,
}));
vi.mock("@/app/(hooks)/usePermissions", () => ({
  usePermissions: () => ({ can: () => api.canDelete }),
}));
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("DeletePersonButton", () => {
  beforeEach(() => {
    api.deletePeopleById.mockReset().mockResolvedValue(undefined);
    api.canDelete = true;
    push.mockReset();
  });
  afterEach(cleanup);

  it("deletes the person and goes back to the list", async () => {
    const user = userEvent.setup();
    render(
      <DeletePersonButton
        person={{ id: "p1", name: "Ana Diaz" }}
        nodeId="n1"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Eliminar",
      }),
    );

    expect(api.deletePeopleById).toHaveBeenCalledWith("p1", {
      organizationId: "n1",
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/portal/n1/person"));
  });

  it("stays on the page if the dialog is cancelled", async () => {
    const user = userEvent.setup();
    render(
      <DeletePersonButton
        person={{ id: "p1", name: "Ana Diaz" }}
        nodeId="n1"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Eliminar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(api.deletePeopleById).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("is not offered without the permission", () => {
    api.canDelete = false;
    render(
      <DeletePersonButton
        person={{ id: "p1", name: "Ana Diaz" }}
        nodeId="n1"
      />,
    );

    expect(screen.queryByRole("button", { name: "Eliminar" })).toBeNull();
  });
});
