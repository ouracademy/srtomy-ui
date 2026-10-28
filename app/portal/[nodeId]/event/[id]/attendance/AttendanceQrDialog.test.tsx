import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AttendanceQrDialog,
  AttendanceQrView,
  attendancePath,
} from "./AttendanceQrDialog";

const hook = vi.hoisted(() => ({
  data: undefined as { token?: string; refreshAt?: Date } | undefined,
  mutate: vi.fn(),
}));

vi.mock("@/app/(api)/generated", () => ({
  useGetEventsByIdAttendanceQr: () => ({
    data: hook.data,
    mutate: hook.mutate,
  }),
}));

beforeEach(() => {
  hook.data = undefined;
  hook.mutate.mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("AttendanceQrView", () => {
  it("shows the QR of the page people open when they scan it", async () => {
    render(
      <AttendanceQrView title="Culto" token="abc.1.def" close={vi.fn()} />,
    );

    expect(
      screen.getByRole("dialog", { name: "QR de asistencia de «Culto»" }),
    ).toBeTruthy();
    expect(
      await screen.findByRole("img", { name: "QR para marcar la asistencia" }),
    ).toBeTruthy();
    expect(screen.getByText(/No hace falta tener cuenta/)).toBeTruthy();
  });

  it("says it is getting the code while it has none", () => {
    render(<AttendanceQrView title="Culto" token={null} close={vi.fn()} />);

    expect(screen.getByText("Preparando el código…")).toBeTruthy();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("closes", async () => {
    const close = vi.fn();
    render(<AttendanceQrView title="Culto" token="abc" close={close} />);

    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Cerrar" }));

    expect(close).toHaveBeenCalledOnce();
  });

  it("the page of the code is /a/{token}", () => {
    expect(attendancePath("abc.1.def")).toBe("/a/abc.1.def");
  });
});

describe("AttendanceQrDialog", () => {
  it("shows the code the API gave", async () => {
    hook.data = {
      token: "abc.1.def",
      refreshAt: new Date(Date.now() + 300_000),
    };

    render(<AttendanceQrDialog eventId="e1" title="Culto" close={vi.fn()} />);

    expect(
      await screen.findByRole("img", { name: "QR para marcar la asistencia" }),
    ).toBeTruthy();
  });

  it("asks for a new code shortly before this one stops being the current one", () => {
    vi.useFakeTimers();
    hook.data = {
      token: "abc.1.def",
      refreshAt: new Date(Date.now() + 120_000),
    };

    render(<AttendanceQrDialog eventId="e1" title="Culto" close={vi.fn()} />);
    act(() => {
      vi.advanceTimersByTime(100_000);
    });
    expect(hook.mutate).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(20_000);
    });

    expect(hook.mutate).toHaveBeenCalledOnce();
  });

  it("never asks in a tight loop when the time is already past", () => {
    vi.useFakeTimers();
    hook.data = {
      token: "abc.1.def",
      refreshAt: new Date(Date.now() - 60_000),
    };

    render(<AttendanceQrDialog eventId="e1" title="Culto" close={vi.fn()} />);
    act(() => {
      vi.advanceTimersByTime(4_000);
    });
    expect(hook.mutate).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(hook.mutate).toHaveBeenCalledOnce();
  });
});
