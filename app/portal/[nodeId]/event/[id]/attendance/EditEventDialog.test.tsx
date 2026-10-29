import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditEventDialog } from "./EditEventDialog";
import type { EventChange } from "./eventChange";

afterEach(cleanup);

const none: EventChange = {
  scheduleMoved: false,
  dayMoved: false,
  ruleChanged: false,
};

const setup = (
  props: {
    repeats?: boolean;
    change?: EventChange;
    onConfirm?: () => Promise<void>;
  } = {},
) => {
  const onConfirm = vi.fn(props.onConfirm ?? (() => Promise.resolve()));
  const close = vi.fn();
  render(
    <EditEventDialog
      open
      repeats={props.repeats ?? false}
      change={props.change ?? none}
      close={close}
      onConfirm={onConfirm}
    />,
  );
  return { onConfirm, close, user: userEvent.setup() };
};

describe("EditEventDialog", () => {
  it("asks which occurrences to edit when the event repeats, this one by default", async () => {
    const { user, onConfirm } = setup({ repeats: true });

    expect(
      screen.getByRole("dialog", { name: "Editar el evento recurrente" }),
    ).toBeTruthy();
    expect(
      (screen.getByRole("radio", { name: "Este evento" }) as HTMLInputElement)
        .checked,
    ).toBe(true);

    await user.click(
      screen.getByRole("radio", { name: "Este y los eventos siguientes" }),
    );
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(onConfirm).toHaveBeenCalledWith("THIS_AND_THE_FOLLOWING_EVENTS");
  });

  it("does not ask for the occurrences of an event that does not repeat", () => {
    setup({ change: { ...none, scheduleMoved: true } });

    expect(screen.queryByRole("radio")).toBeNull();
    expect(
      screen.getByRole("dialog", { name: "Guardar los cambios" }),
    ).toBeTruthy();
  });

  it("warns about the emails when the schedule moves", () => {
    setup({ change: { ...none, scheduleMoved: true } });

    expect(screen.getByText(/recibirán un correo/)).toBeTruthy();
  });

  it("warns what is kept when the rule of the series changes, only if it reaches more than this event", async () => {
    const { user } = setup({
      repeats: true,
      change: { ...none, ruleChanged: true },
    });

    expect(screen.queryByText(/inscritos o asistencia no cambian/)).toBeNull();
    expect(screen.getByText(/dejará de ser parte de la serie/)).toBeTruthy();

    await user.click(screen.getByRole("radio", { name: "Todos los eventos" }));

    expect(screen.getByText(/inscritos o asistencia no cambian/)).toBeTruthy();
    expect(screen.queryByText(/dejará de ser parte de la serie/)).toBeNull();
  });

  it("blocks both buttons and shows a spinner while it saves", async () => {
    let finish: () => void = () => undefined;
    const { user } = setup({
      onConfirm: () => new Promise<void>((resolve) => (finish = resolve)),
    });

    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(
      (screen.getByRole("button", { name: "Cancelar" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Guardar cambios",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    finish();
  });

  it("closes with Cancelar without saving", async () => {
    const { user, close, onConfirm } = setup();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(close).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
