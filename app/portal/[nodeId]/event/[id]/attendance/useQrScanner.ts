"use client";

import React from "react";

// The browser's own QR reader, where it exists (Chrome and Edge on phones and
// desktop). Safari and Firefox do not have it: the screen offers typing the
// code instead.
type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};
type BarcodeDetectorConstructor = new (options: {
  formats: string[];
}) => BarcodeDetectorLike;

const detectorConstructor = (): BarcodeDetectorConstructor | undefined =>
  (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor })
    .BarcodeDetector;

export const canScanWithCamera = (): boolean =>
  detectorConstructor() !== undefined &&
  typeof navigator !== "undefined" &&
  typeof navigator.mediaDevices?.getUserMedia === "function";

// Why the camera did not start, in the words of the screen.
const cameraProblem = (error: unknown): string => {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "La cámara no tiene permiso. Actívelo en la configuración del navegador para este sitio, o escriba el código.";
  }
  if (name === "NotFoundError" || name === "OverconstrainedError") {
    return "Este dispositivo no tiene una cámara que se pueda usar. Escriba el código.";
  }
  return "No se pudo usar la cámara. Revise el permiso o escriba el código.";
};

// Reads QR codes from the camera while `active`. The same code is not reported
// twice in a row within `repeatAfterMs`, so a code held in front of the camera
// is not sent over and over. `problem` is why the camera is not working.
export const useQrScanner = (
  active: boolean,
  onCode: (code: string) => void,
  repeatAfterMs = 4000,
) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);
  // The scanner keeps running across renders; it reads the latest handler.
  const onCodeRef = React.useRef(onCode);
  React.useEffect(() => {
    onCodeRef.current = onCode;
  });

  React.useEffect(() => {
    const Detector = detectorConstructor();
    if (!active || !Detector || !canScanWithCamera()) return;
    let stopped = false;
    let stream: MediaStream | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const lastSeen = new Map<string, number>();

    const scan = async (detector: BarcodeDetectorLike) => {
      const video = videoRef.current;
      if (!stopped && video && video.readyState >= 2) {
        try {
          for (const code of await detector.detect(video)) {
            const now = Date.now();
            const before = lastSeen.get(code.rawValue) ?? 0;
            if (now - before >= repeatAfterMs) {
              lastSeen.set(code.rawValue, now);
              onCodeRef.current(code.rawValue);
            }
          }
        } catch {
          // A frame that cannot be read is skipped.
        }
      }
      if (!stopped) timer = setTimeout(() => scan(detector), 400);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((media) => {
        if (stopped) {
          media.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = media;
        if (videoRef.current) {
          videoRef.current.srcObject = media;
          void videoRef.current.play();
        }
        void scan(new Detector({ formats: ["qr_code"] }));
      })
      .catch((error: unknown) => setProblem(cameraProblem(error)));

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [active, repeatAfterMs]);

  return { videoRef, problem };
};
