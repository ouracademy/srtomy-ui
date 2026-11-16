import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scriptedTransport, textReply } from "./chatStream.test-utils";
import { AssistantButton } from "./AssistantButton";

const route = vi.hoisted(() => ({ pathname: "/portal/node-1" }));
vi.mock("next/navigation", () => ({ usePathname: () => route.pathname }));

const auth = vi.hoisted(() => ({
  user: { sub: "auth0|ana" },
  loginWithPopup: vi.fn(),
}));
vi.mock("@auth0/auth0-react", () => ({ useAuth0: () => auth }));

const api = vi.hoisted(() => ({
  permissions: ["events.read", "members.read"] as string[],
}));
vi.mock("@/app/(api)/generated", () => ({
  useGetOrganizationsById: (id: string) => ({
    data: id
      ? { id, name: id === "node-2" ? "Jóvenes" : "Sede Central" }
      : undefined,
  }),
  useGetMePermissions: () => ({ data: api.permissions, isLoading: false }),
}));

const agent = vi.hoisted(() => ({ transport: undefined as unknown }));
vi.mock("@/app/(api)/assistant", () => ({
  createAssistantTransport: () => ({
    sendMessages: (options: unknown) =>
      (
        agent.transport as {
          sendMessages: (options: unknown) => Promise<unknown>;
        }
      ).sendMessages(options),
    reconnectToStream: async () => null,
  }),
}));

const openButton = () =>
  screen.getByRole("button", { name: "Abrir asistente" });

describe("AssistantButton", () => {
  beforeEach(() => {
    route.pathname = "/portal/node-1";
    api.permissions = ["events.read", "members.read"];
    agent.transport = scriptedTransport([]).transport;
  });
  afterEach(cleanup);

  it("is a floating button with an accessible name on a node's screens", () => {
    render(<AssistantButton />);

    expect(openButton()).toBeVisible();
  });

  it("does not show outside a node", () => {
    route.pathname = "/portal/me";
    render(<AssistantButton />);

    expect(
      screen.queryByRole("button", { name: "Abrir asistente" }),
    ).not.toBeInTheDocument();
  });

  it("opens the panel on the node with suggestions the user can ask", async () => {
    const user = userEvent.setup();
    render(<AssistantButton />);

    await user.click(openButton());

    const dialog = screen.getByRole("dialog", { name: "Asistente" });
    expect(dialog).toHaveTextContent("En Sede Central");
    expect(
      screen.getByRole("button", { name: "¿Qué eventos hay esta semana?" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "¿Qué grupos y ministerios hay?" }),
    ).not.toBeInTheDocument();
  });

  it("gives the focus back to the button when it closes", async () => {
    const user = userEvent.setup();
    render(<AssistantButton />);

    await user.click(openButton());
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(openButton()).toHaveFocus();
  });

  it("keeps the conversation while the user moves to another node", async () => {
    const user = userEvent.setup();
    agent.transport = scriptedTransport([
      textReply("En Sede Central hay 40 personas."),
    ]).transport;
    const { rerender } = render(<AssistantButton />);

    await user.click(openButton());
    await user.type(
      screen.getByRole("textbox", { name: "Escribe tu pregunta" }),
      "¿Cuántos somos?{Enter}",
    );
    await screen.findByText("En Sede Central hay 40 personas.", {
      selector: "p",
    });
    await user.click(screen.getByRole("button", { name: "Cerrar asistente" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );

    route.pathname = "/portal/node-2/event";
    rerender(<AssistantButton />);
    await user.click(openButton());

    expect(screen.getByRole("dialog")).toHaveTextContent("En Jóvenes");
    expect(
      screen.getByText("En Sede Central hay 40 personas.", { selector: "p" }),
    ).toBeInTheDocument();
  });
});
