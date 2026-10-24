import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { PositionsField, type PositionDraft } from "./PositionsField";

afterEach(cleanup);

const catalog = [
  { resource: "members", permissions: ["members.read", "members.write"] },
];
const suggestions = [{ name: "Pastor", permissions: ["members.write"] }];

const Harness = ({ initial }: { initial: PositionDraft[] }) => {
  const [value, setValue] = React.useState(initial);
  return (
    <>
      <PositionsField
        value={value}
        onChange={setValue}
        catalog={catalog}
        suggestions={suggestions}
      />
      <output aria-label="valor">{JSON.stringify(value)}</output>
    </>
  );
};

const value = () =>
  JSON.parse(screen.getByLabelText("valor").textContent ?? "[]");

describe("PositionsField", () => {
  it("adds and removes rows", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[{ name: "Ujier", permissions: [] }]} />);

    await user.click(screen.getByRole("button", { name: "Agregar cargo" }));
    expect(value()).toHaveLength(2);
    await user.click(
      screen.getByRole("button", { name: "Quitar cargo Ujier" }),
    );

    expect(value()).toEqual([{ name: "", permissions: [] }]);
  });

  it("brings the usual permissions of a suggested name while the row has none", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[{ name: "", permissions: [] }]} />);

    await user.type(
      screen.getByRole("combobox", { name: "Cargo 1" }),
      "Pastor",
    );

    expect(value()).toEqual([
      { name: "Pastor", permissions: ["members.write"] },
    ]);
  });

  it("does not override permissions already chosen", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[{ name: "", permissions: ["members.read"] }]} />);

    await user.type(
      screen.getByRole("combobox", { name: "Cargo 1" }),
      "Pastor",
    );

    expect(value()).toEqual([
      { name: "Pastor", permissions: ["members.read"] },
    ]);
  });

  it("says how much a row gives and edits it by module", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[{ name: "Ujier", permissions: [] }]} />);

    expect(
      screen.getByRole("button", { name: "Permisos del cargo 1" }),
    ).toHaveTextContent("Sin acceso a la app");
    await user.click(
      screen.getByRole("button", { name: "Permisos del cargo 1" }),
    );
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("checkbox", { name: "Personas" }),
    );

    expect(value()[0].permissions).toEqual(["members.read", "members.write"]);
    await user.click(within(dialog).getByRole("button", { name: "Listo" }));
    expect(
      screen.getByRole("button", { name: "Permisos del cargo 1" }),
    ).toHaveTextContent("2 permisos");
  });

  it("lists the permissions of a row from its info icon", async () => {
    const user = userEvent.setup();
    render(
      <Harness initial={[{ name: "Ujier", permissions: ["members.read"] }]} />,
    );

    await user.click(
      screen.getByRole("button", { name: "Ver permisos de Ujier" }),
    );

    expect(screen.getByText("Ver personas")).toBeInTheDocument();
  });
});
