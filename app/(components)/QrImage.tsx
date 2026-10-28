"use client";

import QRCode from "qrcode";
import React from "react";

type QrImageProps = Readonly<{
  // What the QR carries: a link or a code.
  value: string;
  // What it is, for who cannot see it ("QR de su ticket").
  label: string;
  size?: number;
}>;

// A QR code drawn in the browser. Nothing is sent anywhere to make it, and it
// is a plain SVG, so it works at any size and in print.
export const QrImage = ({ value, label, size = 220 }: QrImageProps) => {
  const [src, setSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    let current = true;
    // A margin of 2 modules of white around it, so a scanner finds its edges
    // even on a dark or busy background.
    QRCode.toString(value, { type: "svg", margin: 2, width: size })
      .then((svg) => {
        if (current) {
          setSrc(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`);
        }
      })
      .catch(() => {
        if (current) setSrc(null);
      });
    return () => {
      current = false;
    };
  }, [value, size]);

  if (!src) return null;
  return (
    // A data URL: there is nothing for next/image to optimize. It is `size`
    // wide at most and shrinks to fit a narrow screen, with some air around it
    // instead of touching the edges of what holds it.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={label}
      width={size}
      height={size}
      style={{
        width: "100%",
        maxWidth: size,
        height: "auto",
        padding: 8,
        boxSizing: "border-box",
        background: "#fff",
      }}
    />
  );
};
