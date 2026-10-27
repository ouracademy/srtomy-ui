import { act, cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { canScanWithCamera, useQrScanner } from "./useQrScanner";

const Harness = ({
  active,
  onCode,
}: {
  active: boolean;
  onCode: (code: string) => void;
}) => {
  const { videoRef, problem } = useQrScanner(active, onCode, 4000);
  return (
    <>
      <video ref={videoRef} data-testid="camera" />
      {problem && <p>{problem}</p>}
    </>
  );
};

type Globals = typeof globalThis & { BarcodeDetector?: unknown };
const stop = vi.fn();
const detect = vi.fn();

const installCamera = (grant = true) => {
  (globalThis as Globals).BarcodeDetector = class {
    detect = detect;
  };
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: {
      getUserMedia: vi.fn(() =>
        grant
          ? Promise.resolve({ getTracks: () => [{ stop }] })
          : Promise.reject(new Error("denied")),
      ),
    },
  });
};

beforeEach(() => {
  vi.useFakeTimers();
  stop.mockClear();
  detect.mockReset();
  Object.defineProperty(HTMLMediaElement.prototype, "readyState", {
    configurable: true,
    get: () => 4,
  });
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  delete (globalThis as Globals).BarcodeDetector;
  Object.defineProperty(navigator, "mediaDevices", {
    configurable: true,
    value: undefined,
  });
});

const flush = async (ms = 0) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};

describe("canScanWithCamera", () => {
  it("is false where the browser has no QR reader", () => {
    expect(canScanWithCamera()).toBe(false);
  });

  it("is true when it has the reader and the camera", () => {
    installCamera();

    expect(canScanWithCamera()).toBe(true);
  });
});

describe("useQrScanner", () => {
  it("reports each code it reads", async () => {
    installCamera();
    detect.mockResolvedValue([{ rawValue: "ticket-1" }]);
    const onCode = vi.fn();

    render(<Harness active onCode={onCode} />);
    await flush(1000);

    expect(onCode).toHaveBeenCalledWith("ticket-1");
  });

  it("does not report the same code again until the time has passed", async () => {
    installCamera();
    detect.mockResolvedValue([{ rawValue: "ticket-1" }]);
    const onCode = vi.fn();

    render(<Harness active onCode={onCode} />);
    await flush(2000);
    expect(onCode).toHaveBeenCalledTimes(1);
    await flush(3000);

    expect(onCode).toHaveBeenCalledTimes(2);
  });

  it("reports different codes as they come", async () => {
    installCamera();
    detect
      .mockResolvedValueOnce([{ rawValue: "a" }])
      .mockResolvedValue([{ rawValue: "b" }]);
    const onCode = vi.fn();

    render(<Harness active onCode={onCode} />);
    await flush(1000);

    expect(onCode.mock.calls.map((call) => call[0])).toEqual(["a", "b"]);
  });

  it("keeps going after a frame that cannot be read", async () => {
    installCamera();
    detect
      .mockRejectedValueOnce(new Error("blurry"))
      .mockResolvedValue([{ rawValue: "ticket-2" }]);
    const onCode = vi.fn();

    render(<Harness active onCode={onCode} />);
    await flush(1000);

    expect(onCode).toHaveBeenCalledWith("ticket-2");
  });

  it("explains when the camera cannot be used", async () => {
    installCamera(false);

    render(<Harness active onCode={vi.fn()} />);
    await flush(10);

    expect(screen.getByText(/No se pudo usar la cámara/)).toBeTruthy();
  });

  it("turns the camera off when it is closed", async () => {
    installCamera();
    detect.mockResolvedValue([]);

    const { unmount } = render(<Harness active onCode={vi.fn()} />);
    await flush(500);
    unmount();

    expect(stop).toHaveBeenCalled();
  });

  it("does nothing while it is not active", async () => {
    installCamera();
    const onCode = vi.fn();

    render(<Harness active={false} onCode={onCode} />);
    await flush(2000);

    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    expect(onCode).not.toHaveBeenCalled();
  });
});
