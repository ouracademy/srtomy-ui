import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { PermissionPicker } from "./PermissionPicker";

afterEach(cleanup);

const catalog = [
  { resource: "members", permissions: ["members.read", "members.write"] },
  { resource: "events", permissions: ["events.read"] },
];

const Harness = ({
  initial = [],
  locked,
  disabled,
}: {
  initial?: string[];
  locked?: string[];
  disabled?: boolean;
}) => {
  const [value, setValue] = React.useState(initial);
  return (
    <>
      <PermissionPicker
        catalog={catalog}
        value={value}
        onChange={setValue}
        locked={locked}
        disabled={disabled}
      />
      <output aria-label="valor">{JSON.stringify(value)}</output>
    </>
  );
};

const value = () =>
  JSON.parse(screen.getByLabelText("valor").textContent ?? "[]");

describe("PermissionPicker", () => {
  it("checks one permission at a time", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("checkbox", { name: "Ver personas" }));

    expect(value()).toEqual(["members.read"]);
  });

  it("checks a whole module at once", async () => {
    const user = userEvent.setup();
    render(<Harness initial={["events.read"]} />);

    await user.click(screen.getByRole("checkbox", { name: "Personas" }));

    expect(value()).toEqual(["events.read", "members.read", "members.write"]);
  });

  it("shows permissions that come from a role as checked and fixed", async () => {
    const user = userEvent.setup();
    render(<Harness locked={["members.read"]} />);

    const locked = screen.getByRole("checkbox", { name: "Ver personas" });
    expect(locked).toBeChecked();
    expect(locked).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: "Personas" }));
    expect(value()).toEqual(["members.write"]);
  });

  it("cannot be edited when disabled", () => {
    render(<Harness initial={["events.read"]} disabled />);

    expect(
      screen.getByRole("checkbox", { name: "Ver eventos y cursos" }),
    ).toBeDisabled();
  });
});
