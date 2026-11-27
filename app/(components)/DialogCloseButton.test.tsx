import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DialogCloseButton } from "./DialogCloseButton";

afterEach(cleanup);

describe("DialogCloseButton", () => {
  it("is a button named Cerrar that calls onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<DialogCloseButton onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("cannot be used when it is disabled", () => {
    render(<DialogCloseButton onClick={vi.fn()} disabled />);

    expect(screen.getByRole("button", { name: "Cerrar" })).toBeDisabled();
  });
});
