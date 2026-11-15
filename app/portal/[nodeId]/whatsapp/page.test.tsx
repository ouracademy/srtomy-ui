import { act, cleanup, render, screen } from "@testing-library/react";
import { Suspense } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WhatsAppPage from "./page";

const hooks = vi.hoisted(() => ({
  permissions: new Set<string>(),
  connection: {
    data: undefined as unknown,
    error: undefined as unknown,
    isLoading: false,
  },
  link: {
    data: undefined as unknown,
    error: undefined as unknown,
    isLoading: false,
  },
  connectionEnabled: [] as boolean[],
  refreshInterval: undefined as
    ((latest?: { status?: string }) => number) | undefined,
  search: "",
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(hooks.search),
}));

vi.mock("@/app/(hooks)/usePermissions", () => ({
  usePermissions: () => ({ can: (p: string) => hooks.permissions.has(p) }),
}));

vi.mock("@/app/(api)/generated", () => ({
  useGetOrganizationsByIdWhatsapp: (
    _id: string,
    options?: {
      swr?: {
        enabled?: boolean;
        refreshInterval?: (latest?: { status?: string }) => number;
      };
    },
  ) => {
    hooks.connectionEnabled.push(options?.swr?.enabled ?? true);
    hooks.refreshInterval = options?.swr?.refreshInterval;
    return { ...hooks.connection, mutate: vi.fn() };
  },
  useGetOrganizationsByIdWhatsappLink: () => ({
    ...hooks.link,
    mutate: vi.fn(),
  }),
  postOrganizationsByIdWhatsappSetupLink: vi.fn(),
  postOrganizationsByIdWhatsappTemplates: vi.fn(),
  putOrganizationsByIdWhatsappAgent: vi.fn(),
  postOrganizationsByIdWhatsappLinkCode: vi.fn(),
  deleteOrganizationsByIdWhatsapp: vi.fn(),
  deleteOrganizationsByIdWhatsappLink: vi.fn(),
}));

vi.mock("@/app/(components)/ResourceError", () => ({
  ResourceError: () => <p>Error al cargar</p>,
}));

const renderPage = async () => {
  const params = Promise.resolve({ nodeId: "n1" });
  await act(async () => {
    render(
      <Suspense fallback={null}>
        <WhatsAppPage params={params} />
      </Suspense>,
    );
    await params;
  });
};

beforeEach(() => {
  hooks.permissions = new Set();
  hooks.connection = {
    data: { status: "NOT_CONNECTED" },
    error: undefined,
    isLoading: false,
  };
  hooks.link = { data: { linked: false }, error: undefined, isLoading: false };
  hooks.connectionEnabled = [];
  hooks.refreshInterval = undefined;
  hooks.search = "";
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("WhatsAppPage", () => {
  it("a plain member only sees their own WhatsApp and the church's is not even asked for", async () => {
    await renderPage();

    expect(
      await screen.findByRole("heading", { name: "Mi WhatsApp" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "WhatsApp de la iglesia" }),
    ).toBeNull();
    expect(hooks.connectionEnabled.every((enabled) => !enabled)).toBe(true);
  });

  it("whoever can edit the church also sees how to connect it", async () => {
    hooks.permissions = new Set(["org.update"]);

    await renderPage();

    expect(
      await screen.findByRole("heading", { name: "WhatsApp de la iglesia" }),
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Mi WhatsApp" })).toBeTruthy();
  });

  it("shows a spinner while it loads", async () => {
    hooks.link = { data: undefined, error: undefined, isLoading: true };

    await renderPage();

    expect(screen.queryByRole("heading", { name: "Mi WhatsApp" })).toBeNull();
  });

  it("shows the error when the link cannot be read", async () => {
    hooks.link = {
      data: undefined,
      error: new Error("boom"),
      isLoading: false,
    };

    await renderPage();

    expect(await screen.findByText("Error al cargar")).toBeTruthy();
  });

  it("shows the error when the church's connection cannot be read", async () => {
    hooks.permissions = new Set(["org.update"]);
    hooks.connection = {
      data: undefined,
      error: new Error("boom"),
      isLoading: false,
    };

    await renderPage();

    expect(await screen.findByText("Error al cargar")).toBeTruthy();
  });

  describe("coming back from the registration", () => {
    const asPastor = () => {
      hooks.permissions = new Set(["org.update"]);
    };

    it("says it is confirming while the connection is still pending, and keeps asking", async () => {
      asPastor();
      hooks.search = "conexion=completada";
      hooks.connection.data = { status: "PENDING" };

      await renderPage();

      expect(await screen.findByRole("status")).toBeTruthy();
      expect(screen.getByText(/confirmando la conexión/i)).toBeTruthy();
      expect(hooks.refreshInterval?.({ status: "PENDING" })).toBe(3000);
      expect(hooks.refreshInterval?.({ status: "CONNECTED" })).toBe(0);
    });

    it("says it is connected once the notice arrived", async () => {
      asPastor();
      hooks.search = "conexion=completada";
      hooks.connection.data = { status: "CONNECTED", displayNumber: "+51 1" };

      await renderPage();

      expect(await screen.findByText("WhatsApp quedó conectado.")).toBeTruthy();
    });

    it("stops waiting after a minute and tells the pastor what to do", async () => {
      asPastor();
      vi.useFakeTimers();
      hooks.search = "conexion=completada";
      hooks.connection.data = { status: "PENDING" };

      await renderPage();
      await act(async () => {
        vi.advanceTimersByTime(60_000);
      });

      expect(
        screen.getByText(/Todavía no recibimos la confirmación/),
      ).toBeTruthy();
      expect(hooks.refreshInterval?.({ status: "PENDING" })).toBe(0);
    });

    it("tells the pastor when the registration failed", async () => {
      asPastor();
      hooks.search = "conexion=fallida";

      await renderPage();

      expect(
        await screen.findByText(/No se pudo completar la conexión/),
      ).toBeTruthy();
    });

    it("shows no notice when the pastor did not come back from a registration", async () => {
      asPastor();

      await renderPage();

      expect(
        await screen.findByRole("heading", { name: "WhatsApp" }),
      ).toBeTruthy();
      expect(screen.queryByRole("status")).toBeNull();
    });
  });
});
