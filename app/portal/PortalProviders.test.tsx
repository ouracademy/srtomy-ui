import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PortalProviders } from "./PortalProviders";

const agent = vi.hoisted(() => ({ url: undefined as string | undefined }));
vi.mock("../(api)/assistant", () => ({
  get agentUrl() {
    return agent.url;
  },
}));
vi.mock("../(api)/client", () => ({ fetchSwrKey: vi.fn() }));
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
});
