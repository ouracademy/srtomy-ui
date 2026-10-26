import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MySpacePage from "./page";

const hooks = vi.hoisted(() => ({
  useGetMe: vi.fn(),
  useGetMeOrganizations: vi.fn(),
  useGetMeNodes: vi.fn(),
  useGetMeEvents: vi.fn(),
  useGetMeSharedEvents: vi.fn(),
  useGetMeInvitations: vi.fn(),
}));
vi.mock("@/app/(api)/generated", () => hooks);
vi.mock("@auth0/auth0-react", () => ({
  useAuth0: () => ({ user: { name: "Bob Prueba" } }),
}));
vi.mock("../useAcceptInvitation", () => ({
  useAcceptInvitation: () => vi.fn(),
}));
// The frame (top bar, picker, user menu) has its own tests.
vi.mock("../MenuDrawer", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const ok = (data: unknown) => ({
  data,
  error: undefined,
  isLoading: false,
  mutate: vi.fn(),
});

beforeEach(() => {
  hooks.useGetMe.mockReturnValue(ok({}));
  hooks.useGetMeOrganizations.mockReturnValue(
    ok([
      { id: "c1", name: "Iglesia Vida", type: "CHURCH", accessible: false },
      {
        id: "g1",
        name: "Jóvenes",
        type: "GROUP",
        parentId: "c1",
        accessible: true,
      },
    ]),
  );
  hooks.useGetMeNodes.mockReturnValue(
    ok([
      {
        id: "g1",
        name: "Jóvenes",
        type: "GROUP",
        churchName: "Iglesia Vida",
        leader: false,
        positions: [],
      },
    ]),
  );
  hooks.useGetMeEvents.mockReturnValue(
    ok([{ title: "Retiro", slug: "abc", attended: true, isACourse: false }]),
  );
  hooks.useGetMeSharedEvents.mockReturnValue(ok([]));
  hooks.useGetMeInvitations.mockReturnValue(ok([]));
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Mi espacio", () => {
  it("shows the four sections to a plain member", () => {
    render(<MySpacePage />);

    expect(screen.getByRole("heading", { name: "Mi espacio" })).toBeTruthy();
    for (const name of [
      "Mis eventos y cursos",
      "Mis grupos y ministerios",
      "Compartidos contigo",
      "Tienes invitaciones",
    ]) {
      expect(screen.getByRole("heading", { name })).toBeTruthy();
    }
    expect(screen.getByRole("link", { name: "Retiro" })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Directorio" })).toBeNull();
  });

  it("offers no administration", () => {
    render(<MySpacePage />);

    expect(screen.queryByText(/Accesos/)).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Guardar|Eliminar/ }),
    ).toBeNull();
  });

  it("offers to register a church to someone who belongs to none", () => {
    hooks.useGetMeOrganizations.mockReturnValue(ok([]));

    render(<MySpacePage />);

    expect(
      screen.getByRole("link", { name: "Registrar otra iglesia" }),
    ).toBeTruthy();
  });

  it("keeps the other sections when one request fails", () => {
    hooks.useGetMeEvents.mockReturnValue({
      data: undefined,
      error: new Error("boom"),
      isLoading: false,
      mutate: vi.fn(),
    });

    render(<MySpacePage />);

    expect(
      screen.queryByRole("heading", { name: "Mis eventos y cursos" }),
    ).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Mis grupos y ministerios" }),
    ).toBeTruthy();
  });
});
