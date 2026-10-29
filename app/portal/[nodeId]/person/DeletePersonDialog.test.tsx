import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { DeletePersonDialog } from "./DeletePersonDialog";

const api = vi.hoisted(() => ({ deletePeopleById: vi.fn() }));
vi.mock("@/app/(api)/generated", () => api);

const showMessage = vi.fn();
const close = vi.fn();
const onDeleted = vi.fn();
const ana = { id: "p1", name: "Ana Diaz" };

const failure = (status: number, data: unknown) =>
  new AxiosError("failed", "ERR_BAD_REQUEST", undefined, undefined, {
    status,
    data,
  } as never);

const renderDialog = (
  props: Partial<React.ComponentProps<typeof DeletePersonDialog>> = {},
) =>
  render(
    <SnackbarContext.Provider value={{ message: "", showMessage }}>
      <DeletePersonDialog
        person={ana}
        nodeId="n1"
        nodeType="CHURCH"
        close={close}
        onDeleted={onDeleted}
        {...props}
      />
    </SnackbarContext.Provider>,
  );

describe("DeletePersonDialog", () => {
  beforeEach(() => {
    api.deletePeopleById.mockReset();
    showMessage.mockReset();
    close.mockReset();
    onDeleted.mockReset();
  });
  afterEach(cleanup);

  it("renders nothing while there is no person", () => {
    renderDialog({ person: null });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("removes the person from the church and refreshes the list", async () => {
    const user = userEvent.setup();
    api.deletePeopleById.mockResolvedValue(undefined);
    renderDialog();

    expect(screen.getByText("Eliminar a Ana Diaz de la iglesia")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(api.deletePeopleById).toHaveBeenCalledWith("p1", {
      organizationId: "n1",
    });
    await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
    expect(showMessage).toHaveBeenCalledWith("Eliminado exitosamente");
    expect(close).toHaveBeenCalled();
  });

  it("says it only takes the person out of the group when not on the church", async () => {
    const user = userEvent.setup();
    api.deletePeopleById.mockResolvedValue(undefined);
    renderDialog({ nodeType: "GROUP" });

    expect(screen.getByText("Quitar a Ana Diaz de este grupo")).toBeVisible();
    expect(screen.getByText(/Seguirá en el resto de la iglesia/)).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Quitar" }));

    expect(api.deletePeopleById).toHaveBeenCalledWith("p1", {
      organizationId: "n1",
    });
  });

  it("warns about the account and only unlinks it once confirmed", async () => {
    const user = userEvent.setup();
    api.deletePeopleById
      .mockRejectedValueOnce(failure(409, { code: "PERSON_HAS_ACCOUNT" }))
      .mockResolvedValueOnce(undefined);
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(await screen.findByText("Ana Diaz tiene una cuenta")).toBeVisible();
    expect(onDeleted).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Eliminar y quitar acceso" }),
    );

    expect(api.deletePeopleById).toHaveBeenLastCalledWith("p1", {
      organizationId: "n1",
      confirmUnlinkUser: true,
    });
    await waitFor(() => expect(onDeleted).toHaveBeenCalledOnce());
    expect(showMessage).toHaveBeenCalledWith("Eliminado exitosamente");
  });

  it("shows what the API says when it refuses, and closes", async () => {
    const user = userEvent.setup();
    api.deletePeopleById.mockRejectedValue(
      failure(403, { detail: "La persona no pertenece a este grupo" }),
    );
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() =>
      expect(showMessage).toHaveBeenCalledWith(
        "La persona no pertenece a este grupo",
      ),
    );
    expect(onDeleted).not.toHaveBeenCalled();
    expect(close).toHaveBeenCalled();
  });

  it("falls back to a generic message when the API gives none", async () => {
    const user = userEvent.setup();
    api.deletePeopleById.mockRejectedValue(failure(500, undefined));
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    await waitFor(() =>
      expect(showMessage).toHaveBeenCalledWith(
        "No se pudo eliminar. Intenta de nuevo.",
      ),
    );
  });
});
