import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { QrImage } from "./QrImage";

afterEach(cleanup);

describe("QrImage", () => {
  it("draws the code as an image with a label", async () => {
    render(
      <QrImage
        value="https://app.test/a/token"
        label="QR de asistencia"
        size={180}
      />,
    );

    const image = await screen.findByRole("img", { name: "QR de asistencia" });
    expect(image.getAttribute("src")).toMatch(/^data:image\/svg\+xml;utf8,/);
    expect(image.getAttribute("width")).toBe("180");
  });

  it("draws a different image for a different value", async () => {
    const { rerender } = render(<QrImage value="uno" label="QR" />);
    const first = (await screen.findByRole("img", { name: "QR" })).getAttribute(
      "src",
    );

    rerender(<QrImage value="dos" label="QR" />);

    await screen.findByRole("img", { name: "QR" });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(
      screen.getByRole("img", { name: "QR" }).getAttribute("src"),
    ).not.toBe(first);
  });
});
