import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SaveButton } from "./SaveButton";

afterEach(cleanup);

describe("SaveButton", () => {
  it("is enabled and has no spinner when idle", () => {
    render(<SaveButton name="Guardar" />);

    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("shows a spinner and blocks clicks while loading", () => {
    render(<SaveButton name="Guardar" loading />);

    expect(screen.getByRole("button", { name: "Guardar" })).toBeDisabled();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows the add icon only when asked", () => {
    const { rerender } = render(<SaveButton name="Agregar" />);
    expect(screen.queryByTestId("AddIcon")).not.toBeInTheDocument();

    rerender(<SaveButton name="Agregar" add />);
    expect(screen.getByTestId("AddIcon")).toBeInTheDocument();
  });
});
