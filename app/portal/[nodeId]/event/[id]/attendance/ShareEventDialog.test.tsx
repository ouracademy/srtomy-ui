import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  EventRegistrationResponse,
  EventSharingResponse,
} from "@/app/(api)/generated/aPISrTommy.schemas";
import { ShareEventDialog } from "./ShareEventDialog";

afterEach(cleanup);

const sharing: EventSharingResponse = {
  generalAccess: "RESTRICTED",
  linkRole: "VIEWER",
  slug: "abc123",
  isACourse: false,
  shares: [{ id: "s1", email: "ana@x.org", role: "EDITOR" }],
  registrations: 0,
};

const registrations: EventRegistrationResponse[] = [
  {
    id: "r1",
    firstName: "Lucía",
    lastName: "Mora",
    email: "lucia@x.org",
    phoneNumber: "999",
  },
];

const setup = (
  props: {
    sharing?: EventSharingResponse;
    registrations?: EventRegistrationResponse[];
    onShare?: (email: string, role: string) => Promise<void>;
  } = {},
) => {
  const onShare = vi.fn<(email: string, role: string) => Promise<void>>(
    props.onShare ?? (() => Promise.resolve()),
  );
  const handlers = {
    onShare,
    onUnshare: vi.fn().mockResolvedValue(undefined),
    onChangeAccess: vi.fn().mockResolvedValue(undefined),
    onRenewLink: vi.fn().mockResolvedValue(undefined),
    onRemoveRegistration: vi.fn().mockResolvedValue(undefined),
    onCopy: vi.fn(),
    close: vi.fn(),
  };
  render(
    <ShareEventDialog
      open
      title="Retiro"
      sharing={props.sharing ?? sharing}
      registrations={props.registrations ?? []}
      {...handlers}
    />,
  );
  return { ...handlers, user: userEvent.setup() };
};

describe("ShareEventDialog", () => {
  it("lists who the event is shared with and their role", () => {
    setup();

    expect(
      screen.getByRole("dialog", { name: "Compartir «Retiro»" }),
    ).toBeTruthy();
    const people = screen.getByRole("list", { name: "Personas con acceso" });
    expect(within(people).getByText("ana@x.org")).toBeTruthy();
    expect(within(people).getByText("Editor")).toBeTruthy();
  });

  it("shares with an email and a role, then clears the form", async () => {
    const { onShare, user } = setup();

    await user.type(
      screen.getByLabelText("Correo de la persona"),
      "luis@x.org",
    );
    await user.click(screen.getByRole("combobox", { name: "Rol" }));
    await user.click(screen.getByRole("option", { name: "Editor" }));
    await user.click(screen.getByRole("button", { name: "Compartir" }));

    expect(onShare).toHaveBeenCalledWith("luis@x.org", "EDITOR");
    expect(
      (screen.getByLabelText("Correo de la persona") as HTMLInputElement).value,
    ).toBe("");
  });

  it("does not send an email that is not one", async () => {
    const { onShare, user } = setup();

    await user.type(screen.getByLabelText("Correo de la persona"), "luis");
    await user.click(screen.getByRole("button", { name: "Compartir" }));

    expect(screen.getByText("Ingrese un correo válido")).toBeTruthy();
    expect(onShare).not.toHaveBeenCalled();
  });

  it("keeps what was typed when the API refuses", async () => {
    const { user } = setup({
      onShare: vi.fn().mockRejectedValue(new Error("400")),
    });

    await user.type(
      screen.getByLabelText("Correo de la persona"),
      "luis@x.org",
    );
    await user.click(screen.getByRole("button", { name: "Compartir" }));

    expect(
      (screen.getByLabelText("Correo de la persona") as HTMLInputElement).value,
    ).toBe("luis@x.org");
  });

  it("stops sharing with someone", async () => {
    const { onUnshare, user } = setup();

    await user.click(
      screen.getByRole("button", { name: "Quitar a ana@x.org" }),
    );

    expect(onUnshare).toHaveBeenCalledWith("s1");
  });

  it("changes who opens the link and explains it", async () => {
    const { onChangeAccess, user } = setup();

    expect(
      screen.getByText("Solo ven el evento las personas con acceso."),
    ).toBeTruthy();
    await user.click(
      screen.getByRole("combobox", { name: "Quién abre el enlace" }),
    );
    await user.click(
      screen.getByRole("option", { name: "Cualquiera con el enlace" }),
    );

    expect(onChangeAccess).toHaveBeenCalledWith("ANYONE_WITH_LINK", "VIEWER");
  });

  it("only a course offers signing up through the link", async () => {
    const open = { ...sharing, generalAccess: "ANYONE_WITH_LINK" as const };
    const first = setup({ sharing: open });
    await first.user.click(
      screen.getByRole("combobox", { name: "Con el enlace" }),
    );
    expect(
      screen.queryByRole("option", { name: "Puede ver e inscribirse" }),
    ).toBeNull();
    cleanup();

    const second = setup({ sharing: { ...open, isACourse: true } });
    await second.user.click(
      screen.getByRole("combobox", { name: "Con el enlace" }),
    );
    await second.user.click(
      screen.getByRole("option", { name: "Puede ver e inscribirse" }),
    );
    expect(second.onChangeAccess).toHaveBeenCalledWith(
      "ANYONE_WITH_LINK",
      "REGISTRANT",
    );
  });

  it("hides the link role while the event is restricted", () => {
    setup();

    expect(
      screen.queryByRole("combobox", { name: "Con el enlace" }),
    ).toBeNull();
  });

  it("copies the link and renews it", async () => {
    const { onCopy, onRenewLink, user } = setup();

    await user.click(screen.getByRole("button", { name: "Copiar enlace" }));
    expect(onCopy).toHaveBeenCalledWith(expect.stringMatching(/\/e\/abc123$/));
    await user.click(
      screen.getByRole("button", { name: "Crear un enlace nuevo" }),
    );
    expect(onRenewLink).toHaveBeenCalledOnce();
  });

  it("shows the sign-ups of a course and removes one", async () => {
    const { onRemoveRegistration, user } = setup({
      sharing: { ...sharing, isACourse: true, registrations: 1 },
      registrations,
    });

    await user.click(screen.getByRole("tab", { name: "Inscritos (1)" }));
    const list = screen.getByRole("list", { name: "Inscritos" });
    expect(within(list).getByText("Lucía Mora")).toBeTruthy();
    expect(within(list).getByText("lucia@x.org · 999")).toBeTruthy();
    await user.click(
      screen.getByRole("button", {
        name: "Quitar la inscripción de Lucía Mora",
      }),
    );

    expect(onRemoveRegistration).toHaveBeenCalledWith("r1");
  });

  it("has no tabs for an event that is not a course", () => {
    setup();

    expect(screen.queryByRole("tab")).toBeNull();
  });

  it("says when nobody has signed up", async () => {
    const { user } = setup({
      sharing: { ...sharing, isACourse: true, registrations: 0 },
    });

    await user.click(screen.getByRole("tab", { name: "Inscritos (0)" }));

    expect(screen.getByText("Aún no hay inscritos.")).toBeTruthy();
  });
});
