import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SnackbarContext, SnackbarProvider } from "./SnackbarContext";

afterEach(cleanup);

const Trigger = ({ onClick }: { onClick?: () => void }) => {
  const { showMessage } = React.useContext(SnackbarContext);
  return (
    <>
      <button onClick={() => showMessage("Guardado")}>Solo mensaje</button>
      <button
        onClick={() =>
          showMessage("Sede registrada", {
            label: "Ir a la sede",
            onClick: onClick ?? (() => {}),
          })
        }
      >
        Con acción
      </button>
    </>
  );
};

describe("SnackbarProvider", () => {
  it("shows a message without a button", async () => {
    const user = userEvent.setup();
    render(
      <SnackbarProvider>
        <Trigger />
      </SnackbarProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Solo mensaje" }));

    expect(screen.getByText("Guardado")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Ir a la sede" }),
    ).not.toBeInTheDocument();
  });

  it("shows the action and runs it once, closing the message", async () => {
    const user = userEvent.setup();
    const go = vi.fn();
    render(
      <SnackbarProvider>
        <Trigger onClick={go} />
      </SnackbarProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Con acción" }));
    await user.click(screen.getByRole("button", { name: "Ir a la sede" }));

    expect(go).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Sede registrada")).not.toBeInTheDocument();
  });

  it("does not keep the previous action on the next message", async () => {
    const user = userEvent.setup();
    render(
      <SnackbarProvider>
        <Trigger />
      </SnackbarProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Con acción" }));
    await user.click(screen.getByRole("button", { name: "Solo mensaje" }));

    expect(
      screen.queryByRole("button", { name: "Ir a la sede" }),
    ).not.toBeInTheDocument();
  });
});
