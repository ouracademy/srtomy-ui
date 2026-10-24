import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OrganizationPicker } from "./OrganizationPicker";
import type { OrganizationNode } from "./organizationTree";

const can = vi.fn();
vi.mock("../(hooks)/usePermissions", () => ({
  usePermissions: () => ({ can, isLoading: false }),
}));

afterEach(() => {
  cleanup();
  can.mockReset();
});

const nodes: OrganizationNode[] = [
  { id: "c", name: "Iglesia Vida", type: "CHURCH", accessible: false },
  {
    id: "s",
    name: "Sede Centro",
    type: "LOCATION",
    parentId: "c",
    accessible: true,
  },
  {
    id: "y",
    name: "Jóvenes",
    type: "MINISTRY",
    parentId: "s",
    accessible: true,
  },
];

describe("OrganizationPicker", () => {
  it("lists the tree and links to each node it can open", () => {
    render(
      <OrganizationPicker open onClose={vi.fn()} nodes={nodes} currentId="y" />,
    );
    const list = screen.getByRole("list", {
      name: /iglesias, sedes y grupos/i,
    });

    expect(
      within(list).getByRole("link", { name: /jóvenes/i }),
    ).toHaveAttribute("href", "/portal/y");
    expect(
      within(list).getByRole("link", { name: /iglesia vida/i }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.queryByRole("link", { name: /registrar sede/i }),
    ).not.toBeInTheDocument();
  });

  it("filters by name", async () => {
    const user = userEvent.setup();
    render(
      <OrganizationPicker open onClose={vi.fn()} nodes={nodes} currentId="y" />,
    );

    await user.type(screen.getByRole("textbox", { name: "Buscar" }), "sede");

    expect(
      screen.getByRole("link", { name: /sede centro/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /jóvenes/i }),
    ).not.toBeInTheDocument();
    await user.clear(screen.getByRole("textbox", { name: "Buscar" }));
    await user.type(screen.getByRole("textbox", { name: "Buscar" }), "zzz");
    expect(screen.getByText("No hay resultados")).toBeInTheDocument();
  });

  it("offers a new location in the current church only with permission", () => {
    can.mockImplementation(
      (permission: string) => permission === "org.create_child",
    );
    render(
      <OrganizationPicker open onClose={vi.fn()} nodes={nodes} currentId="s" />,
    );

    expect(
      screen.getByRole("link", { name: /registrar sede en iglesia vida/i }),
    ).toHaveAttribute("href", "/portal/c/location/new");
    expect(
      screen.getByRole("link", { name: /registrar otra iglesia/i }),
    ).toHaveAttribute("href", "/portal?nueva=1");
  });
});
