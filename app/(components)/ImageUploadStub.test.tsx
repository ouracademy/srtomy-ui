import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { ImageUploadStub } from "./ImageUploadStub";

afterEach(cleanup);

describe("ImageUploadStub", () => {
  it("has the upload off and says why when the user gets close", async () => {
    const user = userEvent.setup();
    render(<ImageUploadStub name="Alabanza" type="MINISTRY" />);

    const upload = screen.getByRole("button", {
      name: "Subir imagen (próximamente)",
    });
    expect(upload.getAttribute("aria-disabled")).toBe("true");

    await user.hover(upload);
    expect(await screen.findByText("Estamos trabajando en ello")).toBeTruthy();
  });

  it("explains that an icon of the name stands in for now", () => {
    render(<ImageUploadStub />);

    expect(
      screen.getByText(/se muestra un ícono según el nombre/),
    ).toBeTruthy();
  });
});
