import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ScanCard } from "./ScanCard";

vi.mock("./TicketScanner", () => ({
  TicketScanner: ({
    onCheckIn,
  }: {
    onCheckIn: (code: string) => Promise<unknown>;
  }) => (
    <button type="button" onClick={() => void onCheckIn("T-1")}>
      Validar código
    </button>
  ),
}));

afterEach(cleanup);

describe("ScanCard", () => {
  it("opens the scanner and keeps the last person who came in", async () => {
    const onCheckIn = vi.fn(() =>
      Promise.resolve({
        name: "Tomás Quispe",
        ticketName: "Pase sábado",
        checkedInAt: new Date(2026, 10, 14, 9, 20),
      }),
    );
    const user = userEvent.setup();
    render(<ScanCard title="Congreso" onCheckIn={onCheckIn} />);

    await user.click(screen.getByRole("button", { name: "Abrir la cámara" }));
    await user.click(screen.getByRole("button", { name: "Validar código" }));

    expect(onCheckIn).toHaveBeenCalledWith("T-1");
    expect(await screen.findByRole("status")).toHaveTextContent(
      /Ingresó a las .*Tomás Quispe · Pase sábado/,
    );
  });

  it("says when the ticket had already come in", async () => {
    const onCheckIn = vi.fn(() =>
      Promise.resolve({
        name: "Tomás Quispe",
        ticketName: "Pase",
        alreadyCheckedIn: true,
        checkedInAt: new Date(2026, 10, 14, 9, 20),
      }),
    );
    const user = userEvent.setup();
    render(<ScanCard title="Congreso" onCheckIn={onCheckIn} />);

    await user.click(screen.getByRole("button", { name: "Abrir la cámara" }));
    await user.click(screen.getByRole("button", { name: "Validar código" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      /Ya había ingresado/,
    );
  });

  it("shows nothing when the ticket was not valid", async () => {
    const onCheckIn = vi.fn(() => Promise.resolve("No es un ticket"));
    const user = userEvent.setup();
    render(<ScanCard title="Congreso" onCheckIn={onCheckIn} />);

    await user.click(screen.getByRole("button", { name: "Abrir la cámara" }));
    await user.click(screen.getByRole("button", { name: "Validar código" }));

    expect(screen.queryByRole("status")).toBeNull();
  });
});
