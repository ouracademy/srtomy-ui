import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SharedEventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { SharedEventPage } from "./SharedEventPage";

afterEach(cleanup);

const course: SharedEventResponse = {
  title: "Curso de discipulado",
  description: "Ocho semanas de estudio",
  address: "Av. 1",
  start: new Date(2030, 0, 5, 19, 0),
  end: new Date(2030, 0, 5, 21, 0),
  isACourse: true,
  organizationName: "Jóvenes",
  canRegister: true,
  registered: false,
};

const setup = (
  event: SharedEventResponse = course,
  onRegister = vi.fn().mockResolvedValue(false),
  defaults = {},
) => {
  render(
    <SharedEventPage
      event={event}
      defaults={defaults}
      onRegister={onRegister}
    />,
  );
  return { onRegister, user: userEvent.setup() };
};

const fill = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.type(screen.getByLabelText(/Nombre/), "Lucía");
  await user.type(screen.getByLabelText(/Apellido/), "Mora");
  await user.type(screen.getByLabelText(/Correo/), "lucia@x.org");
};

describe("SharedEventPage", () => {
  it("shows what the event is, when and where", () => {
    setup();

    expect(
      screen.getByRole("heading", { name: "Curso de discipulado", level: 1 }),
    ).toBeTruthy();
    expect(screen.getByText("Curso · Jóvenes")).toBeTruthy();
    expect(
      screen.getByText("sábado 5 de enero de 2030, 19:00 a 21:00"),
    ).toBeTruthy();
    expect(screen.getByText("Lugar: Av. 1")).toBeTruthy();
    expect(screen.getByText("Ocho semanas de estudio")).toBeTruthy();
  });

  it("signs up with the data, then thanks the person", async () => {
    const { onRegister, user } = setup();

    await fill(user);
    await user.type(screen.getByLabelText("Teléfono"), "999");
    await user.click(screen.getByRole("button", { name: "Inscribirme" }));

    expect(onRegister).toHaveBeenCalledWith({
      firstName: "Lucía",
      lastName: "Mora",
      email: "lucia@x.org",
      phoneNumber: "999",
    });
    expect(
      await screen.findByText("Listo, quedó inscrito. Gracias."),
    ).toBeTruthy();
    expect(screen.queryByRole("form", { name: "Inscripción" })).toBeNull();
  });

  it("says when that email was already signed up", async () => {
    const { user } = setup(course, vi.fn().mockResolvedValue(true));

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Inscribirme" }));

    expect(
      await screen.findByText("Ya estaba inscrito con ese correo."),
    ).toBeTruthy();
  });

  it("shows why the API refused and keeps the form", async () => {
    const { user } = setup(
      course,
      vi
        .fn()
        .mockResolvedValue("La inscripción por este enlace no está abierta"),
    );

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Inscribirme" }));

    expect(
      await screen.findByText("La inscripción por este enlace no está abierta"),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Inscribirme" })).toBeTruthy();
  });

  it("asks for what is missing instead of sending", async () => {
    const { onRegister, user } = setup();

    await user.type(screen.getByLabelText(/Correo/), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Inscribirme" }));

    expect(screen.getByText("Ingrese su nombre")).toBeTruthy();
    expect(screen.getByText("Ingrese su apellido")).toBeTruthy();
    expect(screen.getByText("Ingrese un correo válido")).toBeTruthy();
    expect(onRegister).not.toHaveBeenCalled();
  });

  it("fills the form for someone who is signed in", () => {
    setup(course, vi.fn(), {
      firstName: "Ana",
      lastName: "Paz",
      email: "ana@x.org",
    });

    expect((screen.getByLabelText(/Nombre/) as HTMLInputElement).value).toBe(
      "Ana",
    );
    expect((screen.getByLabelText(/Correo/) as HTMLInputElement).value).toBe(
      "ana@x.org",
    );
  });

  it("has no form when the link does not allow signing up", () => {
    setup({ ...course, canRegister: false });

    expect(screen.queryByRole("form", { name: "Inscripción" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Inscribirme" })).toBeNull();
  });

  it("says so when the person is already signed up", () => {
    setup({ ...course, registered: true });

    expect(screen.getByText("Ya está inscrito en este curso.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Inscribirme" })).toBeNull();
  });

  it("an event that is not a course is called an event", () => {
    setup({ ...course, isACourse: false, canRegister: false });

    expect(screen.getByText("Evento · Jóvenes")).toBeTruthy();
  });
});
