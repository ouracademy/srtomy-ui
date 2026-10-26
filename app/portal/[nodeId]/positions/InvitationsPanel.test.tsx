import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  InvitationResponse,
  PositionSummaryResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import { InvitationsPanel } from "./InvitationsPanel";

vi.mock("@/app/(api)/generated", () => ({
  useGetPeople: (
    _params: unknown,
    options?: { swr?: { enabled?: boolean } },
  ) => ({
    data: options?.swr?.enabled
      ? {
          content: [
            {
              id: "per1",
              name: "Ana Ruiz",
              fullName: "Ana Ruiz",
              email: "ana@x.org",
            },
            { id: "per2", name: "Sin Correo", fullName: "Sin Correo" },
          ],
        }
      : undefined,
  }),
}));

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
    positionId: "p1",
    personId: "per9",
    status: "PENDING",
    emailStatus: "SENT",
    expiresAt: new Date("2026-11-07T10:00:00"),
  },
  {
    id: "i2",
    email: "luis@x.org",
    personName: "Luis Paz",
    status: "EXPIRED",
    emailStatus: "PENDING",
    expiresAt: new Date("2026-10-01T10:00:00"),
  },
];

const setup = (props: Partial<Parameters<typeof InvitationsPanel>[0]> = {}) => {
  const onInvite = vi.fn().mockResolvedValue(true);
  const onRevoke = vi.fn().mockResolvedValue(undefined);
  render(
    <InvitationsPanel
      nodeId="n1"
      invitations={pending}
      positions={positions}
      onInvite={onInvite}
      onRevoke={onRevoke}
      {...props}
    />,
  );
  return { onInvite, onRevoke, user: userEvent.setup() };
};

const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("button", { name: "Invitar" }));
  return screen.getByRole("dialog");
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

  it("shows whether the email of each invitation left", () => {
    setup({
      invitations: [
        ...pending,
        {
          id: "i3",
          email: "eva@x.org",
          status: "PENDING",
          emailStatus: "FAILED",
        },
      ],
    });

    const table = screen.getByRole("table", {
      name: "Invitaciones pendientes",
    });
    expect(within(table).getByText("Enviado")).toBeTruthy();
    expect(within(table).getByText("En cola")).toBeTruthy();
    expect(within(table).getByText("No salió")).toBeTruthy();
  });

  it("resends the invitation whose email has not left, keeping its position and person", async () => {
    const { onInvite, user } = setup();

    expect(
      screen.queryByRole("button", {
        name: "Reenviar la invitación a ana@x.org",
      }),
    ).toBeNull();
    await user.click(
      screen.getByRole("button", {
        name: "Reenviar la invitación a luis@x.org",
      }),
    );

    expect(onInvite).toHaveBeenCalledWith({ email: "luis@x.org" });
  });

  it("says when there is nothing pending", () => {
    setup({ invitations: [] });

    expect(screen.getByText("No hay invitaciones pendientes.")).toBeTruthy();
  });

  it("opens the dialog and invites by email alone", async () => {
    const { onInvite, user } = setup();

    const dialog = await openDialog(user);
    await user.type(
      within(dialog).getByLabelText(/Correo o persona/),
      "beto@x.org",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Enviar invitación" }),
    );

    expect(onInvite).toHaveBeenCalledWith({ email: "beto@x.org" });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("invites with the chosen position", async () => {
    const { onInvite, user } = setup();

    const dialog = await openDialog(user);
    await user.type(
      within(dialog).getByLabelText(/Correo o persona/),
      "beto@x.org",
    );
    await user.click(within(dialog).getByRole("combobox", { name: "Cargo" }));
    await user.click(screen.getByRole("option", { name: "Pastor" }));
    await user.click(
      within(dialog).getByRole("button", { name: "Enviar invitación" }),
    );

    expect(onInvite).toHaveBeenCalledWith({
      email: "beto@x.org",
      positionId: "p2",
    });
  });

  it("invites a person of the node found by search, with their email", async () => {
    const { onInvite, user } = setup();

    const dialog = await openDialog(user);
    await user.type(within(dialog).getByLabelText(/Correo o persona/), "Ana");
    await user.click(await screen.findByRole("option", { name: /Ana Ruiz/ }));
    await user.click(
      within(dialog).getByRole("button", { name: "Enviar invitación" }),
    );

    expect(onInvite).toHaveBeenCalledWith({
      email: "ana@x.org",
      personId: "per1",
    });
  });

  it("asks for the email of a person who has none", async () => {
    const { onInvite, user } = setup();

    const dialog = await openDialog(user);
    await user.type(within(dialog).getByLabelText(/Correo o persona/), "Sin");
    await user.click(await screen.findByRole("option", { name: /Sin Correo/ }));
    await user.click(
      within(dialog).getByRole("button", { name: "Enviar invitación" }),
    );
    expect(screen.getByText("Ingrese el correo")).toBeTruthy();
    expect(onInvite).not.toHaveBeenCalled();

    await user.type(
      within(dialog).getByLabelText(/Correo de Sin Correo/),
      "sin@x.org",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Enviar invitación" }),
    );

    expect(onInvite).toHaveBeenCalledWith({
      email: "sin@x.org",
      personId: "per2",
    });
  });

  it("opens with the person to invite when coming back from registering them", async () => {
    const { onInvite, user } = setup({
      initialPerson: {
        id: "per3",
        name: "Rosa Díaz",
        fullName: "Rosa Díaz",
        email: "rosa@x.org",
      },
    });

    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Enviar invitación" }),
    );

    expect(onInvite).toHaveBeenCalledWith({
      email: "rosa@x.org",
      personId: "per3",
    });
  });

  it("links to registering a person and coming back to the invitations", async () => {
    const { user } = setup();

    const dialog = await openDialog(user);
    const link = within(dialog).getByRole("link", {
      name: "Registrar persona",
    });

    expect(link.getAttribute("href")).toBe(
      "/portal/n1/person/create?next=%2Fportal%2Fn1%2Fpositions%3Ftab%3Dinvitaciones",
    );
  });

  it("explains what is missing instead of sending", async () => {
    const { onInvite, user } = setup();

    const dialog = await openDialog(user);
    await user.type(within(dialog).getByLabelText(/Correo o persona/), "beto");
    await user.click(
      within(dialog).getByRole("button", { name: "Enviar invitación" }),
    );

    expect(screen.getByText("Ingrese un correo válido")).toBeTruthy();
    expect(onInvite).not.toHaveBeenCalled();
  });

  it("warns when the invitation was saved but the email failed", async () => {
    const { user } = setup({ onInvite: vi.fn().mockResolvedValue(false) });

    const dialog = await openDialog(user);
    await user.type(
      within(dialog).getByLabelText(/Correo o persona/),
      "beto@x.org",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Enviar invitación" }),
    );

    expect(await screen.findByText(/el correo aún no sale/)).toBeTruthy();
  });

  it("keeps the dialog and what was typed when the request fails", async () => {
    const { user } = setup({
      onInvite: vi.fn().mockRejectedValue(new Error("403")),
    });

    const dialog = await openDialog(user);
    await user.type(
      within(dialog).getByLabelText(/Correo o persona/),
      "beto@x.org",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Enviar invitación" }),
    );

    await waitFor(() =>
      expect(
        (
          within(screen.getByRole("dialog")).getByLabelText(
            /Correo o persona/,
          ) as HTMLInputElement
        ).value,
      ).toBe("beto@x.org"),
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
