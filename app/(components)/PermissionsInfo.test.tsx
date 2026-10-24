import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { PermissionsInfo } from "./PermissionsInfo";

afterEach(cleanup);

describe("PermissionsInfo", () => {
  it("lists in words what the position allows", async () => {
    const user = userEvent.setup();
    render(
      <PermissionsInfo
        name="Pastor"
        permissions={["members.read", "members.write"]}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Ver permisos de Pastor" }),
    );

    expect(screen.getByText("Permisos de Pastor")).toBeInTheDocument();
    expect(screen.getByText("Ver personas")).toBeInTheDocument();
    expect(screen.getByText("Crear y editar personas")).toBeInTheDocument();
  });

  it("says a position without permissions is only a name", async () => {
    const user = userEvent.setup();
    render(<PermissionsInfo name="Intercesor" permissions={[]} />);

    await user.click(
      screen.getByRole("button", { name: "Ver permisos de Intercesor" }),
    );

    expect(screen.getByText(/solo un nombre/)).toBeInTheDocument();
  });

  it("names a position that has no name yet", () => {
    render(<PermissionsInfo name=" " permissions={[]} />);

    expect(
      screen.getByRole("button", { name: "Ver permisos de este cargo" }),
    ).toBeInTheDocument();
  });
});
