import type { ChildResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SessionPopover } from "./SessionPopover";

afterEach(cleanup);

const session: ChildResponse = {
  id: "c1",
  title: "Liderazgo, clase 2",
  start: new Date(2026, 10, 14, 10, 30),
  end: new Date(2026, 10, 14, 12, 30),
  isACourse: true,
  registrationMode: "INHERIT",
  track: "Curso de liderazgo",
};

const setup = (canEdit = true, shown: ChildResponse | null = session) => {
  const close = vi.fn();
  const onRemove = vi.fn();
  render(
    <SessionPopover
      nodeId="n1"
      session={shown}
      anchor={document.body}
      close={close}
      canEdit={canEdit}
      onRemove={onRemove}
    />,
  );
  return { close, onRemove, user: userEvent.setup() };
};

describe("SessionPopover", () => {
  it("says what the session is, when and how it is entered", () => {
    setup();

    expect(screen.getByText("Liderazgo, clase 2")).toBeInTheDocument();
    expect(screen.getByText("sáb 14 nov, 10:30 a 12:30")).toBeInTheDocument();
    expect(screen.getByText("Curso de liderazgo")).toBeInTheDocument();
    expect(screen.getByText("Curso")).toBeInTheDocument();
    expect(screen.getByText("Incluido en la inscripción")).toBeInTheDocument();
  });

  it("opens the session to edit it, or to see it for who cannot edit", () => {
    setup(true);
    expect(
      screen.getByRole("link", { name: "Abrir y editar" }),
    ).toHaveAttribute("href", "/portal/n1/event/c1/attendance");
    cleanup();

    setup(false);
    expect(screen.getByRole("link", { name: "Abrir" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Eliminar" })).toBeNull();
  });

  it("closes and asks to delete", async () => {
    const { close, onRemove, user } = setup();

    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(close).toHaveBeenCalled();
    expect(onRemove).toHaveBeenCalledWith(session);
  });

  it("shows nothing without a session", () => {
    setup(true, null);

    expect(screen.queryByText("Liderazgo, clase 2")).toBeNull();
  });
});
