import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PositionsAndAccessPage from "./page";

let permissions: string[] = [];

vi.mock("@/app/(api)/generated", () => ({
  useGetMeOrganizations: () => ({ data: [] }),
}));
vi.mock("@/app/(hooks)/usePermissions", () => ({
  usePermissions: () => ({ can: (p: string) => permissions.includes(p) }),
}));
vi.mock("./PositionsSection", () => ({
  PositionsSection: () => <p>sección cargos</p>,
}));
vi.mock("./AccessSection", () => ({
  AccessSection: () => <p>sección accesos</p>,
}));
vi.mock("./RolesSection", () => ({
  RolesSection: () => <p>sección roles</p>,
}));

// React.use needs a Suspense boundary, and a promise that is the same on every render.
const params = Promise.resolve({ nodeId: "n1" });
const renderPage = () =>
  act(async () => {
    render(
      <React.Suspense fallback={null}>
        <PositionsAndAccessPage params={params} />
      </React.Suspense>,
    );
  });

describe("PositionsAndAccessPage", () => {
  afterEach(cleanup);

  it("shows only positions without iam.read", async () => {
    permissions = [];
    await renderPage();

    expect(await screen.findByText("sección cargos")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Cargos" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Accesos" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "Roles" })).toBeNull();
  });

  it("switches between sections with iam.read", async () => {
    permissions = ["iam.read"];
    const user = userEvent.setup();
    await renderPage();

    await user.click(await screen.findByRole("tab", { name: "Accesos" }));
    expect(screen.getByText("sección accesos")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Roles" }));
    expect(screen.getByText("sección roles")).toBeInTheDocument();
  });
});
