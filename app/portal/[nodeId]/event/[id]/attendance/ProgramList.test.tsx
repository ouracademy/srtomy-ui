import type { ChildResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProgramList } from "./ProgramList";

afterEach(cleanup);

const child = (overrides: Partial<ChildResponse>): ChildResponse => ({
  id: "c1",
  title: "Taller",
  start: new Date(2026, 9, 23, 9, 0),
  end: new Date(2026, 9, 23, 11, 0),
  isACourse: false,
  registrationMode: "INHERIT",
  ...overrides,
});

const setup = (sessions: ChildResponse[], canEdit = true) => {
  const onRemove = vi.fn();
  render(
    <ProgramList
      nodeId="n1"
      sessions={sessions}
      canEdit={canEdit}
      onRemove={onRemove}
    />,
  );
  return { user: userEvent.setup(), onRemove };
};

describe("ProgramList", () => {
  it("lists the sessions by day, with a link, the hours and how each is entered", () => {
    setup([
      child({}),
      child({
        id: "c2",
        title: "Cena",
        registrationMode: "OWN",
        start: new Date(2026, 9, 24, 20, 0),
        end: new Date(2026, 9, 24, 22, 0),
      }),
      child({
        id: "c3",
        title: "Escuela bíblica",
        isACourse: true,
        registrationMode: "OPEN",
      }),
    ]);

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    const link = screen.getByRole("link", { name: /^Taller/ });
    expect(link).toHaveAttribute("href", "/portal/n1/event/c1/attendance");
    expect(within(link).getByText("09:00 a 11:00")).toBeInTheDocument();
    expect(
      within(link).getByText("Incluido en la inscripción"),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("link", { name: /^Cena/ })).getByText(
        "Inscripción propia",
      ),
    ).toBeInTheDocument();
    const course = screen.getByRole("link", { name: /^Escuela bíblica/ });
    expect(within(course).getByText("Curso")).toBeInTheDocument();
    expect(within(course).getByText("Sin inscripción")).toBeInTheDocument();
    expect(screen.getByText("viernes 23 de octubre")).toBeInTheDocument();
    expect(screen.getByText("sábado 24 de octubre")).toBeInTheDocument();
  });

  it("offers to edit and delete a session to whoever can", async () => {
    const { user, onRemove } = setup([child({})]);

    expect(screen.getByRole("link", { name: "Editar Taller" })).toHaveAttribute(
      "href",
      "/portal/n1/event/c1/attendance",
    );
    await user.click(screen.getByRole("button", { name: "Eliminar Taller" }));

    expect(onRemove).toHaveBeenCalledWith(
      expect.objectContaining({ id: "c1" }),
    );
  });

  it("offers neither to someone who cannot write", () => {
    setup([child({})], false);

    expect(screen.queryByRole("link", { name: "Editar Taller" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Eliminar Taller" }),
    ).toBeNull();
  });
});
