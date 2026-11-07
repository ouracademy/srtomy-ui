import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { VisitorsCard } from "./VisitorsCard";

afterEach(cleanup);

const setup = (guestCount = 3) => {
  const onSaveGuests = vi.fn(() => Promise.resolve());
  const onAddVisitor = vi.fn(() => Promise.resolve());
  render(
    <VisitorsCard
      guestCount={guestCount}
      onAddVisitor={onAddVisitor}
      onSaveGuests={onSaveGuests}
    />,
  );
  return { onSaveGuests, onAddVisitor, user: userEvent.setup() };
};

describe("VisitorsCard", () => {
  it("shows how many came without giving a name", () => {
    setup(3);

    const card = screen.getByRole("region", { name: "Visitantes" });
    expect(card).toHaveTextContent("Sin nombre");
    expect(card).toHaveTextContent("3");
  });

  it("adds one with the + button and saves right away", async () => {
    const { onSaveGuests, user } = setup(3);

    await user.click(screen.getByRole("button", { name: "Sumar uno" }));

    expect(onSaveGuests).toHaveBeenCalledWith(4);
  });

  it("takes one out with the - button", async () => {
    const { onSaveGuests, user } = setup(3);

    await user.click(screen.getByRole("button", { name: "Quitar uno" }));

    expect(onSaveGuests).toHaveBeenCalledWith(2);
  });

  it("cannot go below zero", () => {
    setup(0);

    expect(screen.getByRole("button", { name: "Quitar uno" })).toBeDisabled();
  });

  it("opens the form to add a visitor with a name", async () => {
    const { user } = setup();

    await user.click(
      screen.getByRole("button", { name: "Agregar visitante con nombre" }),
    );

    expect(screen.getByLabelText(/Nombre del visitante/)).toBeInTheDocument();
  });
});
