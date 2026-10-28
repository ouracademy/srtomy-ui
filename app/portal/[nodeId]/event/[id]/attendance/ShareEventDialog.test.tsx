import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EventSharingResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import type { SharingDraft } from "@/app/(components)/eventSharing";
import { ShareEventDialog } from "./ShareEventDialog";

afterEach(cleanup);

const sharing: EventSharingResponse = {
  generalAccess: "RESTRICTED",
  slug: "abc123",
  isACourse: false,
  shares: [{ id: "s1", email: "ana@x.org", role: "EDITOR" }],
  registrations: 0,
};

const setup = (
  props: { sharing?: EventSharingResponse; onSave?: () => Promise<void> } = {},
) => {
  const handlers = {
    onSave: vi.fn<(draft: SharingDraft) => Promise<void>>(
      props.onSave ?? (() => Promise.resolve()),
    ),
    onRenewLink: vi.fn().mockResolvedValue(undefined),
    onCopy: vi.fn(),
    close: vi.fn(),
  };
  render(
    <ShareEventDialog
      open
      title="Retiro"
      sharing={props.sharing ?? sharing}
      {...handlers}
    />,
  );
  return { ...handlers, user: userEvent.setup() };
};

const guardar = () => screen.getByRole("button", { name: "Guardar" });

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

  it("has no select for what the link allows: it only lets people see", () => {
    setup();

    expect(
      screen.queryByRole("combobox", { name: "Con el enlace" }),
    ).toBeNull();
    expect(screen.queryByText("Puede ver e inscribirse")).toBeNull();
    // The only selects are the role of a new person and who opens the link,
    // and each has more than one option.
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
  });

  it("never saves by itself and keeps Guardar off until something changes", async () => {
    const { onSave, user } = setup();

    expect(guardar().hasAttribute("disabled")).toBe(true);
    await user.click(
      screen.getByRole("combobox", { name: "Quién abre el enlace" }),
    );
    await user.click(
      screen.getByRole("option", { name: "Cualquiera con el enlace" }),
    );

    expect(onSave).not.toHaveBeenCalled();
    expect(guardar().hasAttribute("disabled")).toBe(false);
  });

  it("goes back to disabled when the change is undone", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("combobox", { name: "Quién abre el enlace" }),
    );
    await user.click(screen.getByRole("option", { name: "Toda la iglesia" }));
    expect(guardar().hasAttribute("disabled")).toBe(false);
    await user.click(
      screen.getByRole("combobox", { name: "Quién abre el enlace" }),
    );
    await user.click(screen.getByRole("option", { name: "Restringido" }));

    expect(guardar().hasAttribute("disabled")).toBe(true);
  });

  it("explains who opens the link", async () => {
    const { user } = setup();

    expect(
      screen.getByText(/Solo ven el evento las personas con acceso\./),
    ).toBeTruthy();
    await user.click(
      screen.getByRole("combobox", { name: "Quién abre el enlace" }),
    );
    await user.click(
      screen.getByRole("option", { name: "Cualquiera con el enlace" }),
    );

    expect(
      screen.getByText(/Cualquiera con el enlace puede ver el evento\./),
    ).toBeTruthy();
  });

  it("adds a person to the draft, marks it unsaved and clears the form", async () => {
    const { onSave, user } = setup();

    await user.type(
      screen.getByLabelText("Correo de la persona"),
      "luis@x.org",
    );
    await user.click(screen.getByRole("combobox", { name: "Rol" }));
    await user.click(screen.getByRole("option", { name: "Editor" }));
    await user.click(screen.getByRole("button", { name: "Agregar" }));

    const people = screen.getByRole("list", { name: "Personas con acceso" });
    expect(within(people).getByText("luis@x.org")).toBeTruthy();
    expect(within(people).getByText("Sin guardar")).toBeTruthy();
    expect(
      (screen.getByLabelText("Correo de la persona") as HTMLInputElement).value,
    ).toBe("");
    expect(onSave).not.toHaveBeenCalled();
  });

  it("does not add an email that is not one", async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText("Correo de la persona"), "luis");
    await user.click(screen.getByRole("button", { name: "Agregar" }));

    expect(screen.getByText("Ingrese un correo válido")).toBeTruthy();
    expect(guardar().hasAttribute("disabled")).toBe(true);
  });

  it("saves everything at once with Guardar and closes", async () => {
    const { onSave, close, user } = setup();

    await user.type(
      screen.getByLabelText("Correo de la persona"),
      "luis@x.org",
    );
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    await user.click(
      screen.getByRole("button", { name: "Quitar a ana@x.org" }),
    );
    await user.click(
      screen.getByRole("combobox", { name: "Quién abre el enlace" }),
    );
    await user.click(screen.getByRole("option", { name: "Toda la iglesia" }));
    await user.click(guardar());

    expect(onSave).toHaveBeenCalledWith({
      generalAccess: "CHURCH",
      added: [{ email: "luis@x.org", role: "VIEWER" }],
      removed: ["s1"],
    });
    expect(close).toHaveBeenCalledOnce();
  });

  it("shows a person that will be removed and lets the user keep them", async () => {
    const { onSave, user } = setup();

    await user.click(
      screen.getByRole("button", { name: "Quitar a ana@x.org" }),
    );
    expect(screen.getByText("Se quitará al guardar")).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: "Conservar a ana@x.org" }),
    );

    expect(screen.getByText("Editor")).toBeTruthy();
    expect(guardar().hasAttribute("disabled")).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("changes the role of someone already there by adding them again", async () => {
    const { onSave, user } = setup();

    await user.type(screen.getByLabelText("Correo de la persona"), "ana@x.org");
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    await user.click(guardar());

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        added: [{ email: "ana@x.org", role: "VIEWER" }],
      }),
    );
  });

  it("removes a person it had only added, without asking the API", async () => {
    const { onSave, user } = setup();

    await user.type(
      screen.getByLabelText("Correo de la persona"),
      "luis@x.org",
    );
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    await user.click(
      screen.getByRole("button", { name: "Quitar a luis@x.org" }),
    );

    expect(screen.queryByText("luis@x.org")).toBeNull();
    expect(guardar().hasAttribute("disabled")).toBe(true);
    expect(onSave).not.toHaveBeenCalled();
  });

  it("keeps the draft and stays open when the API refuses", async () => {
    const { close, user } = setup({
      onSave: vi.fn().mockRejectedValue(new Error("400")),
    });

    await user.type(
      screen.getByLabelText("Correo de la persona"),
      "luis@x.org",
    );
    await user.click(screen.getByRole("button", { name: "Agregar" }));
    await user.click(guardar());

    expect(close).not.toHaveBeenCalled();
    expect(screen.getByText("luis@x.org")).toBeTruthy();
    expect(guardar().hasAttribute("disabled")).toBe(false);
  });

  it("blocks a second click while saving", async () => {
    let finish: () => void = () => undefined;
    const { onSave, user } = setup({
      onSave: () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    });

    await user.click(
      screen.getByRole("combobox", { name: "Quién abre el enlace" }),
    );
    await user.click(screen.getByRole("option", { name: "Toda la iglesia" }));
    await user.click(guardar());

    // While the API answers the button is blocked, so a second click cannot
    // even be made.
    expect(onSave).toHaveBeenCalledOnce();
    expect(guardar().hasAttribute("disabled")).toBe(true);
    await expect(user.click(guardar())).rejects.toThrow(/pointer-events/);
    expect(onSave).toHaveBeenCalledOnce();
    finish();
  });

  it("asks before throwing away unsaved changes", async () => {
    const { close, user } = setup();

    await user.click(
      screen.getByRole("combobox", { name: "Quién abre el enlace" }),
    );
    await user.click(screen.getByRole("option", { name: "Toda la iglesia" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.getByText("Tiene cambios sin guardar.")).toBeTruthy();
    expect(close).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Seguir editando" }));
    expect(screen.queryByText("Tiene cambios sin guardar.")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "Descartar" }));
    expect(close).toHaveBeenCalledOnce();
  });

  it("closes right away when nothing changed", async () => {
    const { close, user } = setup();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(close).toHaveBeenCalledOnce();
  });

  it("copies the link and renews it at once, without Guardar", async () => {
    const { onCopy, onRenewLink, user } = setup();

    await user.click(screen.getByRole("button", { name: "Copiar enlace" }));
    expect(onCopy).toHaveBeenCalledWith(expect.stringMatching(/\/e\/abc123$/));
    await user.click(
      screen.getByRole("button", { name: "Crear un enlace nuevo" }),
    );

    expect(onRenewLink).toHaveBeenCalledOnce();
    expect(guardar().hasAttribute("disabled")).toBe(true);
  });

  it("points to the registration setup instead of offering it here", () => {
    setup();

    expect(
      screen.getByText(/configure la inscripción del evento/),
    ).toBeTruthy();
    expect(screen.queryByRole("tab")).toBeNull();
  });
});
