import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FormSection } from "./FormSection";

afterEach(cleanup);

describe("FormSection", () => {
  it("shows its title as a heading, its description and its content", () => {
    render(
      <FormSection title="Contacto" description="Lo básico para ubicar.">
        <input aria-label="Teléfono" />
      </FormSection>,
    );

    expect(screen.getByRole("heading", { name: "Contacto" })).toBeTruthy();
    expect(screen.getByText("Lo básico para ubicar.")).toBeTruthy();
    expect(screen.getByLabelText("Teléfono")).toBeTruthy();
  });
});
