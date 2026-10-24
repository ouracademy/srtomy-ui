import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AccessEntryResponse } from "@/app/(api)/generated/aPISrTommy.schemas";
import { AccessManager, originLabel } from "./AccessManager";

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
  },
  {
    userId: "u2",
    email: "luis@x.org",
    roleId: "r-leader",
    roleName: "Líder",
    organizationId: "location",
    organizationName: "Sede Centro",
    inherited: true,
    source: "POSITION",
    positionName: "Pastor",
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
  },
];

const setup = (canManage = true, isChurch = true) => {
  const onAddOwner = vi.fn().mockResolvedValue(undefined);
  const onRemoveOwner = vi.fn().mockResolvedValue(undefined);
  render(
    <AccessManager
      entries={entries}
      canManage={canManage}
      isChurch={isChurch}
      positionsHref="/portal/n1/positions"
      onAddOwner={onAddOwner}
      onRemoveOwner={onRemoveOwner}
    />,
  );
  return { user: userEvent.setup(), onAddOwner, onRemoveOwner };
};

describe("originLabel", () => {
  it("says where each access comes from", () => {
    expect(originLabel(entries[0]!)).toBe("Propietario de la iglesia");
    expect(originLabel(entries[1]!)).toBe("Cargo Pastor en Sede Centro");
    expect(originLabel({ ...entries[1]!, inherited: false })).toBe(
      "Cargo Pastor",
    );
    expect(originLabel(entries[2]!)).toBe("Líder de Jóvenes");
  });
});

describe("AccessManager", () => {
  it("lists who has access, at which level and why", () => {
    setup();

    const rows = within(
      screen.getByRole("table", { name: "Personas con acceso" }),
    ).getAllByRole("row");
    expect(within(rows[2]!).getByText("luis@x.org")).toBeInTheDocument();
    expect(within(rows[2]!).getByText("Líder")).toBeInTheDocument();
    expect(
      within(rows[2]!).getByText("Cargo Pastor en Sede Centro"),
    ).toBeInTheDocument();
    expect(within(rows[3]!).getByText("Líder de Jóvenes")).toBeInTheDocument();
  });

  it("does not hand out access: that is done from the positions", () => {
    setup();

    expect(
      screen.queryByRole("button", { name: "Otorgar acceso" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Cargos y niveles de acceso" }),
    ).toHaveAttribute("href", "/portal/n1/positions");
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

  it("only offers Owners on the church", () => {
    setup(true, false);

    expect(
      screen.queryByRole("heading", { name: "Propietarios" }),
    ).not.toBeInTheDocument();
  });

  it("is read-only without iam.manage", () => {
    setup(false);

    expect(
      screen.getByText("ana@x.org", { selector: "li p" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Agregar Propietario" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Quitar Propietario/ }),
    ).not.toBeInTheDocument();
  });
});
