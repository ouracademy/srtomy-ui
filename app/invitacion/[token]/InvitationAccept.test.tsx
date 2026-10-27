import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InvitationPreviewResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { InvitationAccept } from "./InvitationAccept";

afterEach(cleanup);

const invitation: InvitationPreviewResponse = {
  email: "beto@x.org",
  organizationName: "Sede Norte",
  positionName: "Ujier",
  status: "PENDING",
};

const setup = (props: Partial<Parameters<typeof InvitationAccept>[0]> = {}) => {
  const signIn = vi.fn();
  const signOut = vi.fn();
  const accept = vi.fn().mockResolvedValue(undefined);
  render(
    <InvitationAccept
      invitation={invitation}
      signedIn={false}
      ready={false}
      signIn={signIn}
      signOut={signOut}
      accept={accept}
      {...props}
    />,
  );
  return { signIn, signOut, accept, user: userEvent.setup() };
};

describe("InvitationAccept", () => {
  it("says where and as what the person is invited, and to which email", () => {
    setup();

    expect(
      screen.getByRole("heading", { name: "Lo invitaron a Sede Norte" }),
    ).toBeTruthy();
    expect(screen.getByText(/Con el cargo Ujier/)).toBeTruthy();
    expect(screen.getByText("beto@x.org")).toBeTruthy();
  });

  it("asks to sign in first", async () => {
    const { signIn, user } = setup();

    expect(
      screen.queryByRole("button", { name: "Aceptar invitación" }),
    ).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Iniciar sesión o crear cuenta" }),
    );

    expect(signIn).toHaveBeenCalledOnce();
  });

  it("accepts once signed in and the account is ready", async () => {
    const { accept, user } = setup({
      signedIn: true,
      ready: true,
      currentEmail: "beto@x.org",
    });

    expect(screen.getByText("Sesión iniciada como beto@x.org.")).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Aceptar invitación" }),
    );

    expect(accept).toHaveBeenCalledOnce();
  });

  it("waits for the account before enabling the button", () => {
    setup({ signedIn: true, ready: false });

    expect(
      (
        screen.getByRole("button", {
          name: "Aceptar invitación",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("shows why the API refused and offers another account", async () => {
    const { signOut, user } = setup({
      signedIn: true,
      ready: true,
      accept: vi.fn().mockResolvedValue("Esta invitación es para beto@x.org."),
    });

    await user.click(
      screen.getByRole("button", { name: "Aceptar invitación" }),
    );
    expect(
      await screen.findByText("Esta invitación es para beto@x.org."),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Usar otra cuenta" }));

    expect(signOut).toHaveBeenCalledOnce();
  });

  it.each([
    ["EXPIRED", /venció/],
    ["REVOKED", /cancelada/],
    ["ACCEPTED", /ya fue aceptada/],
  ])("a %s invitation cannot be accepted", (status, message) => {
    setup({
      invitation: { ...invitation, status },
      signedIn: true,
      ready: true,
    });

    expect(screen.getByText(message)).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Aceptar invitación" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Iniciar sesión o crear cuenta" }),
    ).toBeNull();
  });

  describe("when the invitation has no name", () => {
    const needsName = { ...invitation, needsName: true };

    it("asks for the name and sends it when accepting", async () => {
      const { accept, user } = setup({
        invitation: needsName,
        signedIn: true,
        ready: true,
      });

      await user.type(screen.getByLabelText(/Nombre/), "Beto");
      await user.type(screen.getByLabelText(/Apellido/), "Pérez");
      await user.click(
        screen.getByRole("button", { name: "Aceptar invitación" }),
      );

      expect(accept).toHaveBeenCalledWith({
        firstName: "Beto",
        lastName: "Pérez",
      });
    });

    it("proposes the name of the sign-in profile", async () => {
      const { accept, user } = setup({
        invitation: needsName,
        signedIn: true,
        ready: true,
        suggestedName: { firstName: "Ana", lastName: "Ruiz" },
      });

      await user.click(
        screen.getByRole("button", { name: "Aceptar invitación" }),
      );

      expect(accept).toHaveBeenCalledWith({
        firstName: "Ana",
        lastName: "Ruiz",
      });
    });

    it("does not accept without both names", async () => {
      const { accept, user } = setup({
        invitation: needsName,
        signedIn: true,
        ready: true,
      });

      await user.type(screen.getByLabelText(/Nombre/), "Beto");
      await user.click(
        screen.getByRole("button", { name: "Aceptar invitación" }),
      );

      expect(screen.getByText("Ingrese su apellido")).toBeTruthy();
      expect(accept).not.toHaveBeenCalled();
    });
  });

  it("does not ask for a name when the invitation already has one", () => {
    setup({ signedIn: true, ready: true });

    expect(screen.queryByLabelText(/Apellido/)).toBeNull();
  });
});
