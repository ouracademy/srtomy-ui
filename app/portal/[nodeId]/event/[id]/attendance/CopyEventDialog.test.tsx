import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopyEventDialog } from "./CopyEventDialog";

const api = vi.hoisted(() => ({ copy: vi.fn() }));
vi.mock("@/app/(api)/generated", () => ({
  postEventsByIdCopy: (...args: unknown[]) => api.copy(...args),
}));

beforeEach(() => {
  api.copy.mockReset();
});
afterEach(cleanup);

const event: EventResponse = {
  id: "mega",
  title: "Avivamiento 2030",
  start: new Date(2030, 0, 5, 9, 0),
  end: new Date(2030, 0, 7, 22, 0),
  children: [
    { id: "c1", title: "Taller" },
    { id: "c2", title: "Cena" },
  ],
};

const setup = () => {
  const copied = vi.fn();
  const close = vi.fn();
  render(<CopyEventDialog event={event} open close={close} copied={copied} />);
  return { copied, close, user: userEvent.setup() };
};

describe("CopyEventDialog", () => {
  it("says what is copied and what is not", () => {
    setup();

    expect(
      screen.getByRole("dialog", { name: "Duplicar «Avivamiento 2030»" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/y sus 2 sub-eventos/)).toBeInTheDocument();
    expect(screen.getByText(/No se copian inscritos/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre de la copia/)).toHaveValue(
      "Avivamiento 2030 (copia)",
    );
  });

  it("creates the copy on the chosen day and goes to it", async () => {
    api.copy.mockResolvedValue({ id: "copia", subEvents: 2 });
    const { copied, user } = setup();

    const day = screen.getByLabelText(/Nueva fecha de inicio/);
    await user.clear(day);
    await user.type(day, "2031-01-04");
    await user.click(screen.getByRole("button", { name: "Duplicar" }));

    expect(api.copy).toHaveBeenCalledWith(
      "mega",
      expect.objectContaining({ name: "Avivamiento 2030 (copia)" }),
    );
    const sent = api.copy.mock.calls[0]?.[1] as { startTime: string };
    expect(new Date(sent.startTime)).toEqual(new Date(2031, 0, 4, 9, 0));
    await vi.waitFor(() => expect(copied).toHaveBeenCalledWith("copia"));
  });

  it("stays open when the copy fails", async () => {
    api.copy.mockRejectedValue({
      isAxiosError: true,
      response: { data: { detail: "La fecha no es válida" } },
    });
    const { copied, user } = setup();

    await user.click(screen.getByRole("button", { name: "Duplicar" }));

    await vi.waitFor(() => expect(api.copy).toHaveBeenCalled());
    expect(copied).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes without copying", async () => {
    const { close, user } = setup();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(close).toHaveBeenCalled();
    expect(api.copy).not.toHaveBeenCalled();
  });
});
