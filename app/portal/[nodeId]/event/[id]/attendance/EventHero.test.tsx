import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventHero } from "./EventHero";

afterEach(cleanup);

const event: EventResponse = {
  id: "e1",
  title: "Congreso Avivamiento 2026",
  start: new Date(2026, 10, 13, 9, 0),
  end: new Date(2026, 10, 15, 20, 0),
  address: "Sede Central, Lima",
};

const setup = (props: Partial<React.ComponentProps<typeof EventHero>> = {}) => {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <EventHero
      event={event}
      generalAccess="ANYONE_WITH_LINK"
      canEdit
      canDelete
      onEdit={onEdit}
      onDelete={onDelete}
      share={<button type="button">Compartir</button>}
      {...props}
    />,
  );
  return { onEdit, onDelete, user: userEvent.setup() };
};

describe("EventHero", () => {
  it("shows the name, who can open it, when and where", () => {
    setup();

    expect(
      screen.getByRole("heading", { name: "Congreso Avivamiento 2026" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cualquiera con el enlace")).toBeInTheDocument();
    expect(screen.getByText("vie 13 nov a dom 15 nov")).toBeInTheDocument();
    expect(screen.getByText("09:00 a 20:00")).toBeInTheDocument();
    expect(screen.getByText("Sede Central, Lima")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Compartir" }),
    ).toBeInTheDocument();
  });

  it("edits from the button and from the date, the hours and the place", async () => {
    const { onEdit, user } = setup();

    await user.click(screen.getByRole("button", { name: "Editar" }));
    await user.click(screen.getByText("vie 13 nov a dom 15 nov"));
    await user.click(screen.getByText("Sede Central, Lima"));

    expect(onEdit).toHaveBeenCalledTimes(3);
  });

  it("deletes from the menu of more actions", async () => {
    const { onDelete, user } = setup();

    await user.click(screen.getByRole("button", { name: "Más acciones" }));
    await user.click(await screen.findByRole("menuitem", { name: "Eliminar" }));

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("offers no edit or delete to someone who cannot", () => {
    setup({ canEdit: false, canDelete: false, generalAccess: undefined });

    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Más acciones" })).toBeNull();
    expect(screen.queryByText("Cualquiera con el enlace")).toBeNull();
    expect(screen.getByText("vie 13 nov a dom 15 nov")).toBeInTheDocument();
  });
});
