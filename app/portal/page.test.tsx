import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import PortalHome from "./page";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
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
  CreateChurchForm: () => <p>Formulario de iglesia</p>,
}));

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
});
