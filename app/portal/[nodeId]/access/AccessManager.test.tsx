import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AccessManager } from "./AccessManager";
import type { NodeType } from "./permissionLabels";

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
  {
    id: "r1",
    name: "Líder",
    permissions: ["org.read", "org.update", "members.write"],
  },
  { id: "r2", name: "Colaborador", permissions: ["org.read"] },
];

const setup = (canManage = true, nodeType?: NodeType) => {
  const onGrant = vi.fn().mockResolvedValue(undefined);
  const onRevoke = vi.fn().mockResolvedValue(undefined);
  render(
    <AccessManager
      entries={entries}
      roles={roles}
      canManage={canManage}
      rolesHref="/portal/n1/access/roles"
      nodeType={nodeType}
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

  it.each<[NodeType, string, string]>([
    [
      "LOCATION",
      "Editar nombre, dirección, teléfono y redes de esta sede y de sus grupos y ministerios",
      "Estos permisos valen para esta sede y para sus grupos y ministerios.",
    ],
    [
      "GROUP",
      "Editar nombre, dirección, teléfono y redes de este grupo y de sus subgrupos",
      "Estos permisos valen para este grupo y para sus subgrupos.",
    ],
  ])(
    "explains what the chosen role allows on a %s",
    async (nodeType, updateLabel, reach) => {
      const { user } = setup(true, nodeType);
      expect(screen.queryByText(/podrá:/)).not.toBeInTheDocument();

      await user.click(screen.getByRole("combobox", { name: "Rol" }));
      await user.click(screen.getByRole("option", { name: "Líder" }));

      expect(screen.getByText("Con el rol Líder podrá:")).toBeInTheDocument();
      expect(screen.getByText(updateLabel)).toBeInTheDocument();
      expect(screen.getByText("Crear y editar personas")).toBeInTheDocument();
      expect(screen.getByText(reach)).toBeInTheDocument();
    },
  );

  it("words the role neutrally and skips the reach when the node type is unknown", async () => {
    const { user } = setup(true);

    await user.click(screen.getByRole("combobox", { name: "Rol" }));
    await user.click(screen.getByRole("option", { name: "Colaborador" }));

    expect(
      screen.getByText("Ver los datos de la iglesia, sede, grupo o ministerio"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Estos permisos valen/)).not.toBeInTheDocument();
  });
});
