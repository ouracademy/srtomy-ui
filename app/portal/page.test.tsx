import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PortalHome from "./page";

const replace = vi.fn();
const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
}));

const hooks = vi.hoisted(() => ({
  useGetMe: vi.fn(),
  useGetMeOrganizations: vi.fn(),
  useGetMeInvitations: vi.fn(),
  useGetMeSharedEvents: vi.fn(),
  getOrganizationsByIdChilds: vi.fn(),
  postOrganizations: vi.fn(),
}));
vi.mock("@/app/(api)/generated", () => hooks);

vi.mock("@auth0/auth0-react", () => ({ useAuth0: () => ({ user: {} }) }));
vi.mock("./useAcceptInvitation", () => ({
  useAcceptInvitation: () => vi.fn(),
}));
vi.mock("./MenuDrawer", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("./CreateChurchForm", () => ({
  CreateChurchForm: ({ submit }: { submit: (values: object) => void }) => (
    <>
      <p>Formulario de iglesia</p>
      <button onClick={() => submit({})}>Crear iglesia</button>
    </>
  ),
}));
vi.mock("./CreateChurchSchema", () => ({
  toCreateChurchRequest: (values: object) => values,
}));

// Like SWR after creating a church: the list starts empty and refreshing it
// brings the new, accessible location.
const useOrganizationsThatGrow = () => {
  const [organizations, setOrganizations] = React.useState<object[]>([]);
  return {
    data: organizations,
    error: undefined,
    isLoading: false,
    mutate: async () =>
      setOrganizations([
        { id: "loc1", name: "Sede", type: "LOCATION", accessible: true },
      ]),
  };
};

const ok = (data: unknown) => ({
  data,
  error: undefined,
  isLoading: false,
  mutate: vi.fn(),
});

beforeEach(() => {
  hooks.useGetMe.mockReturnValue(ok({}));
  hooks.useGetMeInvitations.mockReturnValue(ok([]));
  hooks.useGetMeSharedEvents.mockReturnValue(ok([]));
  hooks.useGetMeOrganizations.mockReturnValue(
    ok([{ id: "n1", name: "Jóvenes", type: "GROUP", accessible: true }]),
  );
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("portal landing", () => {
  it("sends someone who belongs to a church to Mi espacio", () => {
    render(<PortalHome />);

    expect(replace).toHaveBeenCalledWith("/portal/me");
    expect(screen.getByLabelText("Cargando")).toBeTruthy();
  });

  it("asks someone without a church to create one", () => {
    hooks.useGetMeOrganizations.mockReturnValue(ok([]));

    render(<PortalHome />);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("Formulario de iglesia")).toBeTruthy();
  });

  it("does not count an ancestor the user can only see as a breadcrumb", () => {
    hooks.useGetMeOrganizations.mockReturnValue(
      ok([{ id: "c1", name: "Iglesia", type: "CHURCH", accessible: false }]),
    );

    render(<PortalHome />);

    expect(replace).not.toHaveBeenCalled();
  });

  it("opens the new location after creating the church, not Mi espacio", async () => {
    hooks.useGetMeOrganizations.mockImplementation(useOrganizationsThatGrow);
    hooks.postOrganizations.mockResolvedValue({ id: "ch1" });
    hooks.getOrganizationsByIdChilds.mockResolvedValue([
      { id: "loc1", name: "Sede" },
    ]);
    const user = userEvent.setup();
    render(<PortalHome />);

    await user.click(screen.getByRole("button", { name: "Crear iglesia" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/portal/loc1"));
    expect(replace).not.toHaveBeenCalled();
  });
});
