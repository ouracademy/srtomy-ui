import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DialogDeleteConfirmation } from "./DialogDeleteConfirmation";

afterEach(cleanup);

describe("DialogDeleteConfirmation", () => {
  it("shows a spinner until the delete request settles", async () => {
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

    fireEvent.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();

    finishDelete();

    await waitFor(() =>
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
    );
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
