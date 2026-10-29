import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { FormContainer } from "react-hook-form-mui";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { PersonMatches, matchableEmail, matchableName } from "./PersonMatches";

const api = vi.hoisted(() => ({
  matches: undefined as unknown,
  searched: [] as { params: unknown; enabled: boolean | undefined }[],
  postPeopleByIdRestore: vi.fn(),
  putMembership: vi.fn(),
}));
vi.mock("@/app/(api)/generated", () => ({
  useGetPeopleMatches: (
    params: unknown,
    options?: { swr?: { enabled?: boolean } },
  ) => {
    api.searched.push({ params, enabled: options?.swr?.enabled });
    return { data: options?.swr?.enabled ? api.matches : undefined };
  },
  postPeopleByIdRestore: api.postPeopleByIdRestore,
  putPeopleByIdMembershipsByOrganizationId: api.putMembership,
  useGetOrganizationsById: () => ({ data: { name: "Jóvenes", type: "GROUP" } }),
}));
vi.mock("use-debounce", () => ({ useDebounce: (value: unknown) => [value] }));
const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const showMessage = vi.fn();

const renderMatches = (
  values: { firstName: string; lastName: string; email: string } = {
    firstName: "Ana",
    lastName: "Diaz",
    email: "",
  },
) =>
  render(
    <SnackbarContext.Provider value={{ message: "", showMessage }}>
      <FormContainer defaultValues={values}>
        <PersonMatches nodeId="n1" />
      </FormContainer>
    </SnackbarContext.Provider>,
  );

const active = {
  id: "p1",
  fullName: "Ana Diaz",
  email: "ana@example.org",
  phoneNumber: "+51999",
  status: "ACTIVE",
};
const removed = {
  id: "p2",
  fullName: "Ana Diaz Rojas",
  status: "REMOVED",
  removedTime: new Date(2026, 2, 4),
};

describe("matchableName and matchableEmail", () => {
  it("need enough of a name to be worth looking for", () => {
    expect(matchableName("Ana", "Diaz")).toBe("Ana Diaz");
    expect(matchableName("Ana", "")).toBe("Ana");
    expect(matchableName("An", "")).toBeUndefined();
    expect(matchableName(" ", " ")).toBeUndefined();
  });

  it("need something that looks like an email", () => {
    expect(matchableEmail(" ana@example.org ")).toBe("ana@example.org");
    expect(matchableEmail("ana@")).toBeUndefined();
    expect(matchableEmail("")).toBeUndefined();
  });
});

describe("PersonMatches", () => {
  beforeEach(() => {
    api.matches = [];
    api.searched = [];
    api.postPeopleByIdRestore.mockReset();
    api.putMembership.mockReset().mockResolvedValue(undefined);
    showMessage.mockReset();
    push.mockReset();
  });
  afterEach(cleanup);

  it("looks for the typed name and email in the node", () => {
    renderMatches({
      firstName: "Ana",
      lastName: "Diaz",
      email: "ana@example.org",
    });

    expect(api.searched.at(-1)).toEqual({
      params: {
        organizationId: "n1",
        searchText: "Ana Diaz",
        email: "ana@example.org",
      },
      enabled: true,
    });
  });

  it("does not look until there is enough typed", () => {
    renderMatches({ firstName: "A", lastName: "", email: "" });

    expect(api.searched.at(-1)?.enabled).toBe(false);
    expect(screen.queryByText(/Es alguna de estas personas/)).toBeNull();
  });

  it("shows nothing when nobody looks like the person", () => {
    api.matches = [];
    renderMatches();

    expect(screen.queryByText(/Es alguna de estas personas/)).toBeNull();
  });

  it("offers to open a person who is already registered", async () => {
    const user = userEvent.setup();
    api.matches = [active];
    renderMatches();

    expect(screen.getByText("¿Es alguna de estas personas?")).toBeVisible();
    expect(screen.getByText("Ana Diaz")).toBeVisible();
    expect(screen.getByText(/Ya está registrada/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Ver" }));

    expect(push).toHaveBeenCalledWith("/portal/n1/person/p1");
  });

  it("brings back a removed person and opens them to update their data", async () => {
    const user = userEvent.setup();
    api.matches = [removed];
    api.postPeopleByIdRestore.mockResolvedValue("p2");
    renderMatches();

    expect(screen.getByText(/Eliminada el 04\/03\/2026/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Reactivar" }));

    expect(api.postPeopleByIdRestore).toHaveBeenCalledWith("p2", {
      organizationId: "n1",
    });
    await waitFor(() =>
      expect(push).toHaveBeenCalledWith("/portal/n1/person/p2"),
    );
    expect(showMessage).toHaveBeenCalledWith("Persona reactivada");
  });

  it("says why it could not bring them back and stays", async () => {
    const user = userEvent.setup();
    api.matches = [removed];
    api.postPeopleByIdRestore.mockRejectedValue(
      new AxiosError("failed", "ERR_BAD_REQUEST", undefined, undefined, {
        status: 409,
        data: { detail: "La persona ya pertenece a este grupo" },
      } as never),
    );
    renderMatches();

    await user.click(screen.getByRole("button", { name: "Reactivar" }));

    await waitFor(() =>
      expect(showMessage).toHaveBeenCalledWith(
        "La persona ya pertenece a este grupo",
      ),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("adds a person who is already in the church to this node with the chosen state", async () => {
    const user = userEvent.setup();
    api.matches = [active];
    renderMatches();

    await user.click(screen.getByRole("button", { name: "Agregar aquí" }));
    await user.click(
      screen.getByRole("combobox", { name: "Estado en Jóvenes" }),
    );
    await user.click(screen.getByRole("option", { name: "Asistente" }));
    await user.click(screen.getByRole("button", { name: "Agregar" }));

    await waitFor(() =>
      expect(api.putMembership).toHaveBeenCalledWith("p1", "n1", {
        memberState: "MEMBERSHIP_IN_PROGRESS",
      }),
    );
    expect(showMessage).toHaveBeenCalledWith("Ana Diaz fue agregada a Jóvenes");
    expect(push).toHaveBeenCalledWith("/portal/n1/person");
  });

  it("does not offer to add a removed person: they are brought back first", () => {
    api.matches = [removed];
    renderMatches();

    expect(screen.queryByRole("button", { name: "Agregar aquí" })).toBeNull();
  });
});
