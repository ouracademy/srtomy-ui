import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { PositionLevelsField, type PositionDraft } from "./PositionLevelsField";

afterEach(cleanup);

const levels = [
  { id: "l-owner", name: "Propietario", assignable: false },
  {
    id: "l-admin",
    name: "Administrador",
    description: "Administra la iglesia.",
    assignable: true,
  },
];
const suggestions = [{ name: "Pastor", suggestedRoleId: "l-admin" }];

const Harness = ({ initial }: { initial: PositionDraft[] }) => {
  const [value, setValue] = React.useState(initial);
  return (
    <>
      <PositionLevelsField
        value={value}
        onChange={setValue}
        levels={levels}
        suggestions={suggestions}
      />
      <output aria-label="valor">{JSON.stringify(value)}</output>
    </>
  );
};

const value = () =>
  JSON.parse(screen.getByLabelText("valor").textContent ?? "[]");

describe("PositionLevelsField", () => {
  it("adds and removes rows", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[{ name: "Ujier", accessRoleId: "none" }]} />);

    await user.click(screen.getByRole("button", { name: "Agregar cargo" }));
    expect(value()).toHaveLength(2);
    await user.click(
      screen.getByRole("button", { name: "Quitar cargo Ujier" }),
    );

    expect(value()).toEqual([{ name: "", accessRoleId: "none" }]);
  });

  it("takes the usual level of a suggested name while no level was picked", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[{ name: "", accessRoleId: "none" }]} />);

    await user.type(
      screen.getByRole("combobox", { name: "Cargo 1" }),
      "Pastor",
    );

    expect(value()).toEqual([{ name: "Pastor", accessRoleId: "l-admin" }]);
  });

  it("lets the user change the proposed level afterwards", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[{ name: "", accessRoleId: "none" }]} />);

    await user.type(
      screen.getByRole("combobox", { name: "Cargo 1" }),
      "Pastor",
    );
    await user.click(
      screen.getByRole("combobox", { name: "Nivel de acceso del cargo 1" }),
    );
    await user.click(
      screen.getByRole("option", { name: "Sin acceso a la app" }),
    );

    expect(value()).toEqual([{ name: "Pastor", accessRoleId: "none" }]);
  });

  it("does not override a level that was already chosen", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[{ name: "", accessRoleId: "l-other" }]} />);

    await user.type(
      screen.getByRole("combobox", { name: "Cargo 1" }),
      "Pastor",
    );

    expect(value()).toEqual([{ name: "Pastor", accessRoleId: "l-other" }]);
  });

  it("never offers Owner and explains the chosen level", async () => {
    const user = userEvent.setup();
    render(<Harness initial={[{ name: "Pastor", accessRoleId: "l-admin" }]} />);

    expect(screen.getByText("Administra la iglesia.")).toBeInTheDocument();
    await user.click(
      screen.getByRole("combobox", { name: "Nivel de acceso del cargo 1" }),
    );
    expect(
      screen.queryByRole("option", { name: "Propietario" }),
    ).not.toBeInTheDocument();
  });
});
