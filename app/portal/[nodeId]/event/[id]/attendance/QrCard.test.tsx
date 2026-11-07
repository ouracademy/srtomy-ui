import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QrCard } from "./QrCard";

const qr = vi.hoisted(() => ({
  state: { token: "tok" as string | null, onRetry: undefined as unknown },
}));
vi.mock("./AttendanceQrDialog", () => ({
  attendancePath: (token: string) => `/a/${token}`,
  useAttendanceQr: () => qr.state,
  AttendanceQrDialog: () => <div role="dialog" aria-label="QR grande" />,
}));
vi.mock("@/app/(components)/QrImage", () => ({
  QrImage: ({ value, label }: { value: string; label: string }) => (
    <div role="img" aria-label={label} data-value={value} />
  ),
}));

afterEach(cleanup);

describe("QrCard", () => {
  it("shows the QR of the attendance on the screen", () => {
    qr.state = { token: "tok", onRetry: undefined };
    render(<QrCard eventId="e1" title="Culto" />);

    expect(
      screen.getByRole("img", { name: "QR para marcar la asistencia" }),
    ).toHaveAttribute("data-value", expect.stringContaining("/a/tok"));
  });

  it("makes it big on Pantalla completa", async () => {
    qr.state = { token: "tok", onRetry: undefined };
    const user = userEvent.setup();
    render(<QrCard eventId="e1" title="Culto" />);

    await user.click(screen.getByRole("button", { name: "Pantalla completa" }));

    expect(screen.getByRole("dialog", { name: "QR grande" })).toBeVisible();
  });

  it("waits for the code before it can be made big", () => {
    qr.state = { token: null, onRetry: undefined };
    render(<QrCard eventId="e1" title="Culto" />);

    expect(screen.getByText("Preparando el código…")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pantalla completa" }),
    ).toBeDisabled();
  });

  it("lets the user ask again when the code could not be made", async () => {
    const retry = vi.fn();
    qr.state = { token: null, onRetry: retry };
    const user = userEvent.setup();
    render(<QrCard eventId="e1" title="Culto" />);

    await user.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(retry).toHaveBeenCalled();
  });
});
