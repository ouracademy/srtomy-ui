import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeleteRecurrentEventDialog } from "./DeleteRecurrentEventDialog";

afterEach(cleanup);

const setup = () => {
  const close = vi.fn();
  const onDelete = vi.fn();
  render(
    <DeleteRecurrentEventDialog
      open
      close={close}
      onDelete={onDelete}
      initialValues={{ option: "THIS_EVENT" }}
    />,
  );
  return { close, onDelete, user: userEvent.setup() };
};

describe("DeleteRecurrentEventDialog", () => {
  it("closes with the X without deleting", async () => {
    const { close, onDelete, user } = setup();

    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(close).toHaveBeenCalledOnce();
    expect(onDelete).not.toHaveBeenCalled();
  });

  it("deletes with the option chosen", async () => {
    const { close, onDelete, user } = setup();

    await user.click(screen.getByRole("radio", { name: "Todos los eventos" }));
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onDelete.mock.calls[0]?.[0]).toEqual({ option: "ALL_EVENTS" });
    expect(close).not.toHaveBeenCalled();
  });
});
