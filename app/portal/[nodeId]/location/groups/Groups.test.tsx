import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { Groups } from "./Groups";

const replace = vi.fn();
let query = "";

const api = vi.hoisted(() => ({
  deleteOrganizationsById: vi.fn(),
  mutate: vi.fn(),
  data: undefined as unknown,
  error: undefined as unknown,
  loading: false,
}));
const defaultGroups = [
  {
    id: "1",
    name: "Jóvenes",
    type: "GROUP",
    schedule: "Sábados 5 pm",
  },
  { id: "2", name: "Alabanza", type: "MINISTRY" },
];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  usePathname: () => "/portal/n/groups",
  useSearchParams: () => new URLSearchParams(query),
}));
vi.mock("@/app/(api)/generated", () => ({
  deleteOrganizationsById: api.deleteOrganizationsById,
  useGetOrganizationsByIdChilds: () => ({
    data: api.loading || api.error ? undefined : (api.data ?? defaultGroups),
    error: api.error,
    isLoading: api.loading,
    mutate: api.mutate,
  }),
}));

const showMessage = vi.fn();

const renderGroups = (props: Partial<Parameters<typeof Groups>[0]> = {}) =>
  render(
    <SnackbarContext.Provider value={{ message: "", showMessage }}>
      <Groups nodeId="n" {...props} />
    </SnackbarContext.Provider>,
  );

beforeEach(() => {
  replace.mockClear();
  showMessage.mockClear();
  api.deleteOrganizationsById.mockReset().mockResolvedValue(undefined);
  api.mutate.mockReset();
  api.data = undefined;
  api.error = undefined;
  api.loading = false;
  query = "";
});

afterEach(cleanup);

describe("Groups", () => {
  it("has an add link with the add icon and a search box", () => {
    renderGroups({ canCreate: true });

    expect(screen.getByRole("link", { name: "Agregar" })).toHaveAttribute(
      "href",
      "/portal/n/location/groups/create",
    );
    expect(screen.getByTestId("AddIcon")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Buscar por nombre" }),
    ).toBeInTheDocument();
  });

  it("titles the page and says what it lists", () => {
    renderGroups();

    expect(
      screen.getByRole("heading", { level: 1, name: "Grupos y ministerios" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Los grupos y ministerios de esta sede."),
    ).toBeInTheDocument();
  });

  it("shows each one with its type and schedule, and links to it", () => {
    renderGroups();

    const link = screen.getByRole("link", { name: /Jóvenes/ });
    expect(link).toHaveAttribute("href", "/portal/1/location");
    expect(link).toHaveTextContent("Grupo");
    expect(link).toHaveTextContent("Sábados 5 pm");
    expect(screen.getByRole("link", { name: /Alabanza/ })).toHaveTextContent(
      "Sin horario",
    );
    expect(screen.getByText("Mostrando 2 de 2")).toBeInTheDocument();
  });

  it("shows the address of a sede, not a schedule", () => {
    api.data = [
      {
        id: "3",
        name: "Sede Norte",
        type: "LOCATION",
        address: "Av. Lima 123",
      },
      { id: "4", name: "Sede Sur", type: "LOCATION" },
    ];
    renderGroups({ isChurch: true });

    expect(screen.getByText("Av. Lima 123")).toBeInTheDocument();
    expect(screen.getByText("Sin dirección registrada")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Sedes" }),
    ).toBeInTheDocument();
  });

  it("filters the rows by name", async () => {
    const user = userEvent.setup();
    renderGroups();
    expect(screen.getByText("Alabanza")).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: "Buscar por nombre" }),
      "jove",
    );

    await vi.waitFor(() =>
      expect(screen.queryByText("Alabanza")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Jóvenes")).toBeInTheDocument();
  });

  it("puts the search in the url once, after the typing pauses", async () => {
    const user = userEvent.setup();
    renderGroups();
    expect(replace).not.toHaveBeenCalled();

    await user.type(
      screen.getByRole("textbox", { name: "Buscar por nombre" }),
      "ala",
    );

    await vi.waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/portal/n/groups?search=ala"),
    );
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("starts from the search in the url", () => {
    query = "search=ala";
    renderGroups();

    expect(
      screen.getByRole("textbox", { name: "Buscar por nombre" }),
    ).toHaveValue("ala");
    expect(screen.queryByText("Jóvenes")).not.toBeInTheDocument();
    expect(screen.getByText("Alabanza")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("filters by type with the chips, which count what each has", async () => {
    const user = userEvent.setup();
    renderGroups();

    expect(screen.getByRole("button", { name: "Todos 2" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Ministerios 1" }));

    expect(screen.queryByText("Jóvenes")).not.toBeInTheDocument();
    expect(screen.getByText("Alabanza")).toBeInTheDocument();
    expect(screen.getByText("Mostrando 1 de 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Todos 2" }));
    expect(screen.getByText("Jóvenes")).toBeInTheDocument();
  });

  it("has no type chips when there is only one type to list", () => {
    renderGroups({ isChurch: true });
    expect(
      screen.queryByRole("group", { name: "Filtrar por tipo" }),
    ).not.toBeInTheDocument();
    cleanup();

    renderGroups({ insideGroup: true });
    expect(
      screen.queryByRole("group", { name: "Filtrar por tipo" }),
    ).not.toBeInTheDocument();
  });

  it("opens one from its menu", async () => {
    const user = userEvent.setup();
    renderGroups();

    await user.click(
      screen.getByRole("button", { name: "Acciones para Jóvenes" }),
    );

    expect(screen.getByRole("menuitem", { name: "Abrir" })).toHaveAttribute(
      "href",
      "/portal/1/location",
    );
  });

  it("deletes one after confirming, and refreshes the list", async () => {
    const user = userEvent.setup();
    renderGroups({ canDelete: true });

    await user.click(
      screen.getByRole("button", { name: "Acciones para Jóvenes" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Eliminar" }));
    expect(await screen.findByText("¿Eliminar Jóvenes?")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() => expect(api.mutate).toHaveBeenCalledOnce());
    expect(api.deleteOrganizationsById).toHaveBeenCalledWith("1");
    expect(showMessage).toHaveBeenCalledWith("Eliminado exitosamente");
  });

  it("says why it could not delete, and does not refresh", async () => {
    api.deleteOrganizationsById.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderGroups({ canDelete: true });

    await user.click(
      screen.getByRole("button", { name: "Acciones para Jóvenes" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Eliminar" }));
    await user.click(await screen.findByRole("button", { name: "Eliminar" }));

    await waitFor(() =>
      expect(showMessage).toHaveBeenCalledWith(
        "No se pudo eliminar. Intenta de nuevo.",
      ),
    );
    expect(api.mutate).not.toHaveBeenCalled();
  });

  it("does not offer to delete without the permission, nor a sede", async () => {
    const user = userEvent.setup();
    renderGroups();
    await user.click(
      screen.getByRole("button", { name: "Acciones para Jóvenes" }),
    );
    expect(
      screen.queryByRole("menuitem", { name: "Eliminar" }),
    ).not.toBeInTheDocument();
    cleanup();

    renderGroups({ canDelete: true, isChurch: true });
    await user.click(
      screen.getByRole("button", { name: "Acciones para Jóvenes" }),
    );
    expect(
      screen.queryByRole("menuitem", { name: "Eliminar" }),
    ).not.toBeInTheDocument();
  });

  it("tells there is nothing yet, or nothing for the search", async () => {
    api.data = [];
    const { unmount } = render(
      <SnackbarContext.Provider value={{ message: "", showMessage }}>
        <Groups nodeId="n" canCreate />
      </SnackbarContext.Provider>,
    );
    expect(screen.getByText("Aún no hay nada aquí")).toBeVisible();
    expect(
      screen.getByText("Agregue el primero con el botón de arriba."),
    ).toBeVisible();
    unmount();

    api.data = undefined;
    query = "search=zzz";
    renderGroups();
    expect(screen.getByText("No encontramos ninguno")).toBeVisible();
  });

  it("shows loading while the first answer comes, and an error if it fails", () => {
    api.loading = true;
    const { unmount } = renderGroups();
    expect(screen.getByLabelText("Cargando")).toBeVisible();
    unmount();

    api.loading = false;
    api.error = new Error("boom");
    renderGroups();
    expect(screen.getByText("No se pudo cargar")).toBeVisible();
  });
});
