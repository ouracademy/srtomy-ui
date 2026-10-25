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

const usePermissions = vi.fn();
vi.mock("@/app/(hooks)/usePermissions", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/app/(hooks)/usePermissions")>()),
  usePermissions: (...args: unknown[]) => usePermissions(...args),
}));
vi.mock("@auth0/auth0-react", () => ({ useAuth0: () => ({ user: {} }) }));
vi.mock("./lastNode", () => ({
  readLastNode: () => null,
  saveLastNode: vi.fn(),
}));
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
  it("sends a plain member to Mi espacio", () => {
    usePermissions.mockReturnValue({
      permissions: ["org.read", "events.read"],
      isLoading: false,
    });

    render(<PortalHome />);

    expect(replace).toHaveBeenCalledWith("/portal/me");
  });

  it("sends someone who helps manage the node to that node", () => {
    usePermissions.mockReturnValue({
      permissions: ["org.read", "members.read", "attendance.write"],
      isLoading: false,
    });

    render(<PortalHome />);

    expect(replace).toHaveBeenCalledWith("/portal/n1");
  });

  it("waits for the permissions before choosing", () => {
    usePermissions.mockReturnValue({ permissions: [], isLoading: true });

    render(<PortalHome />);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Cargando")).toBeTruthy();
  });

  it("asks someone without a church to create one", () => {
    hooks.useGetMeOrganizations.mockReturnValue(ok([]));
    usePermissions.mockReturnValue({ permissions: [], isLoading: false });

    render(<PortalHome />);

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("Formulario de iglesia")).toBeTruthy();
  });
});
