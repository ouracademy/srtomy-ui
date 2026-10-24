import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccessManager } from "./AccessManager";

afterEach(cleanup);

const entries = [
  {
    bindingId: "b1",
    email: "ana@x.org",
    roleName: "Propietario",
    organizationName: "Iglesia Central",
    inherited: true,
  },
  {
    bindingId: "b2",
    email: "luis@x.org",
    roleName: "Líder",
    organizationName: "Jóvenes",
    inherited: false,
  },
];
const roles = [
  { id: "r1", name: "Líder" },
  { id: "r2", name: "Colaborador" },
];

const setup = (canManage = true) => {
  const onGrant = vi.fn().mockResolvedValue(undefined);
  const onRevoke = vi.fn().mockResolvedValue(undefined);
  render(
    <AccessManager
      entries={entries}
      roles={roles}
      canManage={canManage}
      rolesHref="/portal/n1/access/roles"
      onGrant={onGrant}
      onRevoke={onRevoke}
    />,
  );
  return { user: userEvent.setup(), onGrant, onRevoke };
};

describe("AccessManager", () => {
  it("marks each access as inherited or direct", () => {
    setup();

    const rows = screen.getAllByRole("row");
    expect(
      within(rows[1]!).getByText("Heredado de Iglesia Central"),
    ).toBeInTheDocument();
    expect(within(rows[2]!).getByText("Directo")).toBeInTheDocument();
  });

  it("only lets you remove direct accesses", () => {
    setup();

    expect(
      screen.getByRole("button", { name: "Quitar acceso a luis@x.org" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Quitar acceso a ana@x.org" }),
    ).not.toBeInTheDocument();
  });

  it("asks for confirmation before removing an access", async () => {
    const { user, onRevoke } = setup();

    await user.click(
      screen.getByRole("button", { name: "Quitar acceso a luis@x.org" }),
    );
    await user.click(screen.getByRole("button", { name: /eliminar/i }));

    expect(onRevoke).toHaveBeenCalledWith("b2");
  });

  it("grants a role to an email", async () => {
    const { user, onGrant } = setup();
    const grant = screen.getByRole("button", { name: "Otorgar acceso" });
    expect(grant).toBeDisabled();

    await user.type(screen.getByLabelText("Correo"), " nuevo@x.org ");
    await user.click(screen.getByRole("combobox", { name: "Rol" }));
    await user.click(screen.getByRole("option", { name: "Colaborador" }));
    await user.click(grant);

    expect(onGrant).toHaveBeenCalledWith("nuevo@x.org", "r2");
  });

  it("hides the editing controls without iam.manage", () => {
    setup(false);

    expect(screen.queryByLabelText("Correo")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /quitar acceso/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Administrar roles" }),
    ).toHaveAttribute("href", "/portal/n1/access/roles");
  });
});
