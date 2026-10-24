import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  InvitationResponse,
  PositionSummaryResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import { InvitationsPanel } from "./InvitationsPanel";

afterEach(cleanup);

const positions: PositionSummaryResponse[] = [
  { id: "p1", name: "Ujier" },
  { id: "p2", name: "Pastor" },
];

const pending: InvitationResponse[] = [
  {
    id: "i1",
    email: "ana@x.org",
    personName: "Ana Ruiz",
    positionName: "Ujier",
    status: "PENDING",
    expiresAt: new Date("2026-11-07T10:00:00"),
  },
  {
    id: "i2",
    email: "luis@x.org",
    personName: "Luis Paz",
    status: "EXPIRED",
    expiresAt: new Date("2026-10-01T10:00:00"),
  },
];

const setup = (props: Partial<Parameters<typeof InvitationsPanel>[0]> = {}) => {
  const onInvite = vi.fn().mockResolvedValue(true);
  const onRevoke = vi.fn().mockResolvedValue(undefined);
  render(
    <InvitationsPanel
      invitations={pending}
      positions={positions}
      onInvite={onInvite}
      onRevoke={onRevoke}
      {...props}
    />,
  );
  return { onInvite, onRevoke, user: userEvent.setup() };
};

const fill = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/Correo/), "beto@x.org");
  await user.type(screen.getByLabelText(/Nombre/), "Beto");
  await user.type(screen.getByLabelText(/Apellido/), "Pérez");
};

describe("InvitationsPanel", () => {
  it("lists the pending invitations and flags the expired ones", () => {
    setup();

    const table = screen.getByRole("table", {
      name: "Invitaciones pendientes",
    });
    expect(within(table).getByText("ana@x.org")).toBeTruthy();
    expect(within(table).getByText("Ujier")).toBeTruthy();
    expect(within(table).getByText("07/11/2026")).toBeTruthy();
    expect(within(table).getByText("Sin cargo")).toBeTruthy();
    expect(within(table).getByText("Vencida")).toBeTruthy();
  });

  it("says when there is nothing pending", () => {
    setup({ invitations: [] });

    expect(screen.getByText("No hay invitaciones pendientes.")).toBeTruthy();
  });

  it("sends the invitation with the chosen position and clears the form", async () => {
    const { onInvite, user } = setup();

    await fill(user);
    await user.click(screen.getByRole("combobox", { name: "Cargo" }));
    await user.click(screen.getByRole("option", { name: "Pastor" }));
    await user.click(screen.getByRole("button", { name: "Invitar" }));

    expect(onInvite).toHaveBeenCalledWith({
      email: "beto@x.org",
      firstName: "Beto",
      lastName: "Pérez",
      positionId: "p2",
    });
    expect((screen.getByLabelText(/Correo/) as HTMLInputElement).value).toBe(
      "",
    );
  });

  it("invites without a position", async () => {
    const { onInvite, user } = setup();

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Invitar" }));

    expect(onInvite).toHaveBeenCalledWith({
      email: "beto@x.org",
      firstName: "Beto",
      lastName: "Pérez",
    });
  });

  it("explains what is missing instead of sending", async () => {
    const { onInvite, user } = setup();

    await user.type(screen.getByLabelText(/Correo/), "beto");
    await user.click(screen.getByRole("button", { name: "Invitar" }));

    expect(screen.getByText("Ingrese un correo válido")).toBeTruthy();
    expect(screen.getByText("Ingrese el nombre")).toBeTruthy();
    expect(screen.getByText("Ingrese el apellido")).toBeTruthy();
    expect(onInvite).not.toHaveBeenCalled();
  });

  it("warns when the invitation was saved but the email failed", async () => {
    const { user } = setup({ onInvite: vi.fn().mockResolvedValue(false) });

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Invitar" }));

    expect(await screen.findByText(/no se pudo enviar el correo/)).toBeTruthy();
  });

  it("keeps what was typed when the request fails", async () => {
    const { user } = setup({
      onInvite: vi.fn().mockRejectedValue(new Error("403")),
    });

    await fill(user);
    await expect(
      user.click(screen.getByRole("button", { name: "Invitar" })),
    ).resolves.not.toThrow();

    expect((screen.getByLabelText(/Correo/) as HTMLInputElement).value).toBe(
      "beto@x.org",
    );
  });

  it("cancels an invitation after confirming", async () => {
    const { onRevoke, user } = setup();

    await user.click(
      screen.getByRole("button", {
        name: "Cancelar la invitación de ana@x.org",
      }),
    );
    expect(onRevoke).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Eliminar" }));

    expect(onRevoke).toHaveBeenCalledWith("i1");
  });
});
