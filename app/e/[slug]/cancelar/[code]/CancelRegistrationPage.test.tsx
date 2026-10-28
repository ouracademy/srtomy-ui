import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CancelRegistrationPage } from "./CancelRegistrationPage";

afterEach(cleanup);

describe("CancelRegistrationPage", () => {
  it("asks once, cancels and says the seat is free", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn().mockResolvedValue(null);
    render(<CancelRegistrationPage slug="abc" onCancel={onCancel} />);

    expect(screen.getByText(/¿Seguro que ya no va a asistir\?/)).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Cancelar mi inscripción" }),
    );

    expect(onCancel).toHaveBeenCalledOnce();
    expect(await screen.findByText(/Su inscripción se canceló/)).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Cancelar mi inscripción" }),
    ).toBeNull();
  });

  it("shows why it failed and lets the user try again", async () => {
    const user = userEvent.setup();
    const onCancel = vi
      .fn()
      .mockResolvedValueOnce("No se encontró la inscripción")
      .mockResolvedValueOnce(null);
    render(<CancelRegistrationPage slug="abc" onCancel={onCancel} />);

    await user.click(
      screen.getByRole("button", { name: "Cancelar mi inscripción" }),
    );
    expect(
      await screen.findByText("No se encontró la inscripción"),
    ).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Cancelar mi inscripción" }),
    );

    expect(await screen.findByText(/Su inscripción se canceló/)).toBeTruthy();
    expect(screen.queryByText("No se encontró la inscripción")).toBeNull();
  });

  it("links back to the event", () => {
    render(<CancelRegistrationPage slug="abc" onCancel={vi.fn()} />);

    expect(
      screen
        .getByRole("link", { name: "Volver al evento" })
        .getAttribute("href"),
    ).toBe("/e/abc");
  });
});
