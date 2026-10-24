import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AccessEntryResponse } from "@/app/(api)/generated/aPISrTommy.schemas";
import {
  AccessList,
  groupByPerson,
  OwnersPanel,
  accessLabel,
  originLabel,
} from "./AccessManager";

afterEach(cleanup);

const entries: AccessEntryResponse[] = [
  {
    bindingId: "b1",
    userId: "u1",
    email: "ana@x.org",
    roleId: "r-owner",
    roleName: "Propietario",
    organizationId: "church",
    organizationName: "Iglesia Central",
    inherited: false,
    source: "DIRECT",
    permissionCount: 12,
  },
  {
    userId: "u2",
    email: "luis@x.org",
    organizationId: "location",
    organizationName: "Sede Centro",
    inherited: true,
    source: "POSITION",
    positionName: "Pastor",
    permissionCount: 5,
  },
  {
    userId: "u3",
    email: "eva@x.org",
    roleId: "r-leader",
    roleName: "Líder",
    organizationId: "group",
    organizationName: "Jóvenes",
    inherited: false,
    source: "LEADER",
    permissionCount: 9,
  },
];

describe("originLabel and accessLabel", () => {
  it("say where each access comes from and what it allows", () => {
    expect(originLabel(entries[0]!)).toBe("Propietario de la iglesia");
    expect(originLabel(entries[1]!)).toBe("Cargo Pastor en Sede Centro");
    expect(originLabel({ ...entries[1]!, inherited: false })).toBe(
      "Cargo Pastor",
    );
    expect(originLabel(entries[2]!)).toBe("Líder de Jóvenes");
    expect(accessLabel(entries[0]!)).toBe("Propietario");
    expect(accessLabel(entries[1]!)).toBe("5 permisos");
    expect(accessLabel({ ...entries[1]!, permissionCount: 1 })).toBe(
      "1 permiso",
    );
  });
});

// Ana is also a Pastor: two accesses of the same person.
const anaAlso: AccessEntryResponse = {
  userId: "u1",
  email: "ana@x.org",
  organizationId: "church",
  organizationName: "Iglesia Central",
  inherited: false,
  source: "POSITION",
  positionName: "Servidor",
  permissionCount: 2,
};

describe("groupByPerson", () => {
  it("joins the accesses of the same person", () => {
    const people = groupByPerson([...entries, anaAlso]);

    expect(people.map((p) => p.email)).toEqual([
      "ana@x.org",
      "luis@x.org",
      "eva@x.org",
    ]);
    expect(people[0]!.entries).toHaveLength(2);
  });
});

describe("AccessList", () => {
  it("lists who has access, what it allows and why", () => {
    render(<AccessList entries={entries} />);

    const rows = within(
      screen.getByRole("table", { name: "Personas con acceso" }),
    ).getAllByRole("row");
    expect(within(rows[2]!).getByText("luis@x.org")).toBeInTheDocument();
    expect(within(rows[2]!).getByText("5 permisos")).toBeInTheDocument();
    expect(
      within(rows[2]!).getByText("Cargo Pastor en Sede Centro"),
    ).toBeInTheDocument();
    expect(within(rows[3]!).getByText("Líder de Jóvenes")).toBeInTheDocument();
  });

  it("shows a person with several accesses in one row", () => {
    render(<AccessList entries={[...entries, anaAlso]} />);

    const rows = within(
      screen.getByRole("table", { name: "Personas con acceso" }),
    ).getAllByRole("row");
    expect(rows).toHaveLength(4);
    expect(
      within(rows[1]!).getByText("Propietario de la iglesia"),
    ).toBeInTheDocument();
    expect(within(rows[1]!).getByText("Cargo Servidor")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("2 permisos")).toBeInTheDocument();
  });

  it("marks the signed-in user", () => {
    render(<AccessList entries={entries} currentUserId="u2" />);

    const rows = screen.getAllByRole("row");
    expect(within(rows[2]!).getByText("Tú")).toBeInTheDocument();
    expect(within(rows[1]!).queryByText("Tú")).not.toBeInTheDocument();
  });

  it("filters by email, position or permissions", async () => {
    const user = userEvent.setup();
    render(<AccessList entries={entries} />);

    await user.type(
      screen.getByRole("textbox", { name: /filtrar/i }),
      "pastor",
    );

    expect(screen.getByText("luis@x.org")).toBeInTheDocument();
    expect(screen.queryByText("eva@x.org")).not.toBeInTheDocument();
  });

  it("says when nothing matches", async () => {
    const user = userEvent.setup();
    render(<AccessList entries={entries} />);

    await user.type(screen.getByRole("textbox", { name: /filtrar/i }), "zzz");

    expect(screen.getByText("Sin resultados.")).toBeInTheDocument();
  });

  it("does not hand out access", () => {
    render(<AccessList entries={[]} />);

    expect(screen.getByText("Aún no hay accesos.")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Otorgar acceso" }),
    ).not.toBeInTheDocument();
  });
});

describe("OwnersPanel", () => {
  const setup = (canManage = true) => {
    const onAddOwner = vi.fn().mockResolvedValue(undefined);
    const onRemoveOwner = vi.fn().mockResolvedValue(undefined);
    render(
      <OwnersPanel
        entries={entries}
        canManage={canManage}
        onAddOwner={onAddOwner}
        onRemoveOwner={onRemoveOwner}
      />,
    );
    return { user: userEvent.setup(), onAddOwner, onRemoveOwner };
  };

  it("lists only the Owners", () => {
    setup();

    expect(screen.getByText("ana@x.org")).toBeInTheDocument();
    expect(screen.queryByText("luis@x.org")).not.toBeInTheDocument();
  });

  it("adds an Owner by email", async () => {
    const { user, onAddOwner } = setup();

    await user.type(
      screen.getByRole("textbox", { name: "Correo del nuevo Propietario" }),
      " bob@x.org ",
    );
    await user.click(
      screen.getByRole("button", { name: "Agregar Propietario" }),
    );

    expect(onAddOwner).toHaveBeenCalledWith("bob@x.org");
  });

  it("removes an Owner after confirming", async () => {
    const { user, onRemoveOwner } = setup();

    await user.click(
      screen.getByRole("button", { name: "Quitar Propietario ana@x.org" }),
    );
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(onRemoveOwner).toHaveBeenCalledWith("b1");
  });

  it("is read-only without iam.manage", () => {
    setup(false);

    expect(screen.getByText("ana@x.org")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Agregar Propietario" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Quitar Propietario/ }),
    ).not.toBeInTheDocument();
  });
});
