import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { InvitationResponse } from "@/app/(api)/generated/aPISrTommy.schemas";
import { PendingInvitations } from "./PendingInvitations";

afterEach(cleanup);

const invitations: InvitationResponse[] = [
  { id: "i1", organizationName: "Sede Norte", positionName: "Ujier" },
  { id: "i2", organizationName: "Jóvenes" },
];

describe("PendingInvitations", () => {
  it("shows nothing without invitations", () => {
    const { container } = render(
      <PendingInvitations invitations={[]} accept={vi.fn()} />,
    );

    expect(container.textContent).toBe("");
  });

  it("lists each invitation with its position", () => {
    render(<PendingInvitations invitations={invitations} accept={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Tienes invitaciones" }),
    ).toBeTruthy();
    expect(screen.getByText("Sede Norte")).toBeTruthy();
    expect(screen.getByText("Con el cargo Ujier")).toBeTruthy();
    expect(screen.getByText("Para usar la aplicación")).toBeTruthy();
  });

  it("accepts the chosen invitation", async () => {
    const accept = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<PendingInvitations invitations={invitations} accept={accept} />);

    await user.click(
      screen.getByRole("button", { name: "Aceptar la invitación a Jóvenes" }),
    );

    expect(accept).toHaveBeenCalledWith(invitations[1]);
  });

  it("shows why an invitation was refused", async () => {
    const accept = vi.fn().mockResolvedValue("La invitación venció");
    const user = userEvent.setup();
    render(<PendingInvitations invitations={invitations} accept={accept} />);

    await user.click(
      screen.getByRole("button", {
        name: "Aceptar la invitación a Sede Norte",
      }),
    );

    expect(await screen.findByText("La invitación venció")).toBeTruthy();
  });
});
