import { cleanup, render, screen, waitFor } from "@testing-library/react";
import useSWR from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SnackbarContext } from "../(components)/SnackbarContext";
import { apiClient } from "../(api)/client";
import { PortalProviders } from "./PortalProviders";

const agent = vi.hoisted(() => ({ url: undefined as string | undefined }));
vi.mock("../(api)/assistant", () => ({
  get agentUrl() {
    return agent.url;
  },
}));
vi.mock("../(api)/client", () => ({ apiClient: { get: vi.fn() } }));
vi.mock("./RequireAuth", () => ({
  RequireAuth: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("./assistant/AssistantButton", () => ({
  AssistantButton: () => <button type="button">Abrir asistente</button>,
}));

describe("PortalProviders", () => {
  afterEach(cleanup);

  it("shows the assistant when the agent is configured", () => {
    agent.url = "http://agent.test";
    render(<PortalProviders>contenido</PortalProviders>);

    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Abrir asistente" }),
    ).toBeInTheDocument();
  });

  it("hides the assistant without NEXT_PUBLIC_AGENT_URL", () => {
    agent.url = undefined;
    render(<PortalProviders>contenido</PortalProviders>);

    expect(screen.getByText("contenido")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Abrir asistente" }),
    ).not.toBeInTheDocument();
  });

  it("tells the user when a request of the portal fails", async () => {
    vi.mocked(apiClient.get).mockRejectedValueOnce(new Error("500"));
    const showMessage = vi.fn();
    const Reader = () => {
      useSWR("/organizations/n1/positions");
      return null;
    };

    render(
      <SnackbarContext.Provider value={{ message: "", showMessage }}>
        <PortalProviders>
          <Reader />
        </PortalProviders>
      </SnackbarContext.Provider>,
    );

    await waitFor(() =>
      expect(showMessage).toHaveBeenCalledWith(
        "No se pudo cargar la información",
      ),
    );
  });
});
