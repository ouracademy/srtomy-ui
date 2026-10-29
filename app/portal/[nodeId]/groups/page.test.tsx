import { act, cleanup, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import NodeChildren from "./page";

const state = vi.hoisted(() => ({
  node: undefined as { type: string } | undefined,
  permissions: [] as string[],
  groups: undefined as unknown,
}));

vi.mock("@/app/(api)/generated", () => ({
  useGetOrganizationsById: () => ({ data: state.node, isLoading: false }),
  useGetOrganizationsByIdChilds: () => ({
    data: state.groups ?? [],
    isLoading: false,
    mutate: vi.fn(),
  }),
  deleteOrganizationsById: vi.fn(),
}));
vi.mock("@/app/(hooks)/usePermissions", () => ({
  usePermissions: () => ({
    can: (permission: string) => state.permissions.includes(permission),
  }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

// `params` is a promise in this Next version: React.use suspends until it settles.
const renderPage = async () => {
  const params = Promise.resolve({ nodeId: "n1" });
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <NodeChildren params={params} />
      </Suspense>,
    );
    await params;
  });
};

describe("children of a node", () => {
  afterEach(() => {
    cleanup();
    state.node = undefined;
    state.permissions = [];
    state.groups = undefined;
  });

  it("lists the locations of a church and offers to register one", async () => {
    state.node = { type: "CHURCH" };
    state.permissions = ["org.create_child"];
    state.groups = [{ id: "l1", name: "Sede Norte", type: "LOCATION" }];

    await renderPage();

    expect(await screen.findByText("Sedes")).toBeVisible();
    expect(screen.getByText("Sede Norte")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Registrar sede" }),
    ).toHaveAttribute("href", "/portal/n1/location/new");
  });

  it("offers groups inside a group and nothing to create without permission", async () => {
    state.node = { type: "GROUP" };

    await renderPage();

    expect(await screen.findByText("Grupos")).toBeVisible();
    expect(screen.queryByRole("link", { name: /Registrar/ })).toBeNull();
  });
});
