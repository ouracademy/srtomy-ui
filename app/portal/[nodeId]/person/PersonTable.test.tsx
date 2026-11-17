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
  error: undefined as unknown,
  loading: false,
  asked: [] as unknown[],
}));
vi.mock("@/app/(api)/generated", () => ({
  useGetPeople: (params: unknown) => {
    api.asked.push(params);
    const empty = api.error !== undefined || api.loading;
    return {
      data: empty
        ? undefined
        : (api.people ?? {
            content: [{ id: "p1", fullName: "Ana Diaz" }],
            totalElements: 1,
          }),
      error: api.error,
      isLoading: api.loading,
      isValidating: false,
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
  useSearchParams: () => new URLSearchParams(api.search),
}));

describe("PersonTable", () => {
  beforeEach(() => {
    api.deletePeopleById.mockReset().mockResolvedValue(undefined);
    api.mutate.mockReset();
    api.canDelete = true;
    api.search = "";
    api.people = undefined;
    api.error = undefined;
    api.loading = false;
    api.asked = [];
  });
  afterEach(cleanup);

  it("removes a person from the node after confirming, and refreshes the list", async () => {
    const user = userEvent.setup();
    render(<PersonTable nodeId="n1" />);

    await user.click(
      await screen.findByRole("button", { name: "Acciones para Ana Diaz" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Eliminar" }));
    expect(screen.getByText("Quitar a Ana Diaz de este grupo")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Quitar" }));

    await waitFor(() => expect(api.mutate).toHaveBeenCalledOnce());
    expect(api.deletePeopleById).toHaveBeenCalledWith("p1", {
      organizationId: "n1",
    });
  });

  it("does not offer to delete without the permission", async () => {
    api.canDelete = false;
    const user = userEvent.setup();
    render(<PersonTable nodeId="n1" />);

    await user.click(
      await screen.findByRole("button", { name: "Acciones para Ana Diaz" }),
    );

    expect(screen.getByRole("menuitem", { name: "Ver persona" })).toBeVisible();
    expect(
      screen.queryByRole("menuitem", { name: "Eliminar" }),
    ).not.toBeInTheDocument();
  });

  it("opens the person from the row and from the menu", async () => {
    const user = userEvent.setup();
    render(<PersonTable nodeId="n1" />);

    expect(
      await screen.findByRole("link", { name: /Ana Diaz/ }),
    ).toHaveAttribute("href", "/portal/n1/person/p1");
    await user.click(
      screen.getByRole("button", { name: "Acciones para Ana Diaz" }),
    );
    expect(
      screen.getByRole("menuitem", { name: "Ver persona" }),
    ).toHaveAttribute("href", "/portal/n1/person/p1");
  });

  it("shows the email, or says there is none", async () => {
    api.people = {
      content: [
        { id: "p1", fullName: "Ana Diaz", email: "ana@mail.com" },
        { id: "p2", fullName: "Beto Ruiz" },
      ],
      totalElements: 2,
    };
    render(<PersonTable nodeId="n1" />);

    expect(await screen.findByText("ana@mail.com")).toBeVisible();
    expect(screen.getByText("Sin correo registrado")).toBeVisible();
  });

  it("says how many people are shown out of how many there are", async () => {
    api.people = {
      content: [{ id: "p1", fullName: "Ana Diaz" }],
      totalElements: 1,
    };
    render(<PersonTable nodeId="n1" />);

    expect(await screen.findByText("Mostrando 1 de 1")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Ver más" }),
    ).not.toBeInTheDocument();
  });

  it("asks for more people with Ver más, and starts over with a new search", async () => {
    api.people = {
      content: [{ id: "p1", fullName: "Ana Diaz" }],
      totalElements: 45,
    };
    const user = userEvent.setup();
    const { rerender } = render(<PersonTable nodeId="n1" />);
    expect(api.asked.at(-1)).toMatchObject({ page: 0, size: 20 });

    await user.click(screen.getByRole("button", { name: "Ver más" }));
    expect(api.asked.at(-1)).toMatchObject({ page: 0, size: 40 });

    api.search = "search=ana";
    rerender(<PersonTable nodeId="n1" />);
    expect(api.asked.at(-1)).toMatchObject({ size: 20, searchText: "ana" });
  });

  it("tells there is nobody yet, or nobody for the search", async () => {
    api.people = { content: [], totalElements: 0 };
    const { rerender } = render(<PersonTable nodeId="n1" />);
    expect(await screen.findByText("Aún no hay personas")).toBeVisible();

    api.search = "estado=VISITOR";
    rerender(<PersonTable nodeId="n1" />);
    expect(screen.getByText("No encontramos a nadie")).toBeVisible();
  });

  it("shows loading while the first answer comes, and an error if it fails", () => {
    api.loading = true;
    const { rerender } = render(<PersonTable nodeId="n1" />);
    expect(screen.getByLabelText("Cargando")).toBeVisible();

    api.loading = false;
    api.error = new Error("boom");
    rerender(<PersonTable nodeId="n1" />);
    expect(screen.getByText("No se pudo cargar")).toBeVisible();
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
