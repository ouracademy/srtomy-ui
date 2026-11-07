import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhoneField } from "./PhoneField";

afterEach(cleanup);

// A controlled field, as every form uses it, that remembers what it was given.
const renderField = (initial = "") => {
  const seen: string[] = [];
  const Harness = () => {
    const [value, setValue] = React.useState(initial);
    return (
      <PhoneField
        label="Teléfono"
        value={value}
        onChange={(next) => {
          seen.push(next);
          setValue(next);
        }}
      />
    );
  };
  render(<Harness />);
  return seen;
};

describe("PhoneField", () => {
  it("adds the code of Peru to a number typed without it", async () => {
    const user = userEvent.setup();
    const seen = renderField();

    await user.type(screen.getByLabelText("Teléfono"), "999888777");

    expect(seen.at(-1)).toBe("+51999888777");
  });

  it("gives the number without spaces", async () => {
    const user = userEvent.setup();
    const seen = renderField();

    await user.type(screen.getByLabelText("Teléfono"), "999 888 777");

    expect(seen.at(-1)).not.toMatch(/\s/);
    expect(seen.at(-1)).toBe("+51999888777");
  });

  it("keeps a number already complete as it is", async () => {
    const user = userEvent.setup();
    const seen = renderField("+51999888777");

    await user.type(screen.getByLabelText("Teléfono"), "1");

    expect(seen.at(-1)).toBe("+519998887771");
  });

  it("is empty when the person types nothing or erases everything", async () => {
    const user = userEvent.setup();
    const seen = renderField("+51999888777");

    await user.clear(screen.getByLabelText("Teléfono"));

    // Never a lone "+51": a form that treats an empty phone as optional must see "".
    expect(seen.at(-1)).toBe("");
    expect(seen.every((value) => !/^\+(51|57)$/.test(value))).toBe(true);
  });

  it("keeps the country once Colombia is the one chosen", async () => {
    const user = userEvent.setup();
    const seen = renderField("+57");

    await user.type(screen.getByLabelText("Teléfono"), "3001234567");

    expect(seen.at(-1)).toBe("+573001234567");
  });

  it("shows the error text it is given", () => {
    render(
      <PhoneField
        label="Teléfono"
        value=""
        onChange={vi.fn()}
        error
        helperText="Número inválido"
      />,
    );

    expect(screen.getByText("Número inválido")).toBeTruthy();
  });
});
