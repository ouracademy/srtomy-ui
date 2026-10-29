import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DialogDeleteConfirmation } from "./DialogDeleteConfirmation";

afterEach(cleanup);

describe("DialogDeleteConfirmation", () => {
  it("shows a spinner until the delete request settles", async () => {
    const user = userEvent.setup();
    let finishDelete: () => void = () => undefined;
    const onDelete = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishDelete = resolve;
        }),
    );
    render(
      <DialogDeleteConfirmation
        open
        close={() => undefined}
        onDelete={onDelete}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();

    finishDelete();

    await waitFor(() =>
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
    );
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("uses a generic text unless told what is being deleted", () => {
    render(
      <DialogDeleteConfirmation
        open
        close={() => undefined}
        onDelete={() => undefined}
      />,
    );

    expect(screen.getByText("Deseas eliminar")).toBeInTheDocument();
    expect(
      screen.getByText(/una vez eliminado no podrás recuperarlo/),
    ).toBeInTheDocument();
  });

  it("shows the given title, message and confirm label", () => {
    render(
      <DialogDeleteConfirmation
        open
        close={() => undefined}
        onDelete={() => undefined}
        title="Quitar a Ana"
        message="Saldrá del grupo"
        confirmLabel="Quitar"
      />,
    );

    expect(screen.getByText("Quitar a Ana")).toBeInTheDocument();
    expect(screen.getByText("Saldrá del grupo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quitar" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Eliminar" }),
    ).not.toBeInTheDocument();
  });
});
