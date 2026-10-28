import { cleanup, render, screen, within } from "@testing-library/react";
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
vi.mock("@/app/(api)/generated", () => ({
  ...hooks,
  deletePublicRegistrationsByCancelCode: vi.fn(),
}));
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

const sharedRetiro = {
  title: "Retiro",
  slug: "abc",
  isACourse: false,
  role: "VIEWER",
};

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

  // it("offers to register a church to someone who belongs to none", () => {
  //   hooks.useGetMeOrganizations.mockReturnValue(ok([]));

  //   render(<MySpacePage />);

  //   expect(
  //     screen.getByRole("link", { name: "Registrar otra iglesia" }),
  //   ).toBeTruthy();
  // });

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

  it("does not list as shared what is already mine by a place or by having gone", () => {
    hooks.useGetMeSharedEvents.mockReturnValue(
      ok([sharedRetiro, { ...sharedRetiro, title: "Vigilia", slug: "vig" }]),
    );

    render(<MySpacePage />);

    const shared = screen.getByRole("list", { name: "Compartidos contigo" });
    // "Retiro" is in "Mis eventos y cursos" (the user went); "Vigilia" is not.
    expect(within(shared).queryByRole("link", { name: "Retiro" })).toBeNull();
    expect(within(shared).getByRole("link", { name: "Vigilia" })).toBeTruthy();
  });

  it("explains in plain words what each of the two sections is", () => {
    render(<MySpacePage />);

    expect(
      screen.getByText(/donde tienes un lugar y a los que ya asististe/),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /que otra persona te compartió y que todavía no son tuyos/,
      ),
    ).toBeTruthy();
  });
});
