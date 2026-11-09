import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MyEventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { MyEvents } from "./MyEvents";

afterEach(cleanup);

const withTicket: MyEventResponse = {
  title: "Curso de discipulado",
  start: new Date(2030, 1, 2, 19, 0),
  isACourse: true,
  organizationName: "Sede Norte",
  registered: true,
  attended: false,
  slug: "abc",
  registrationId: "r1",
  ticketName: "General",
  registrationStatus: "CONFIRMED",
  cancelCode: "cancel-1",
  ticketCode: "ticket-1",
};

const secondPlace: MyEventResponse = {
  ...withTicket,
  title: "Retiro de jóvenes",
  slug: "wait",
  isACourse: false,
  registrationStatus: "CONFIRMED",
  cancelCode: "cancel-2",
  ticketCode: "ticket-2",
};

const wentToService: MyEventResponse = {
  title: "Culto dominical",
  start: new Date(2030, 0, 5, 10, 0),
  isACourse: false,
  organizationName: "Iglesia Central",
  registered: false,
  attended: true,
  slug: "culto",
};

const wentWithTicket: MyEventResponse = {
  ...withTicket,
  title: "Taller de música",
  slug: "taller",
  attended: true,
};

const setup = (
  events: MyEventResponse[],
  onCancel = vi.fn().mockResolvedValue(undefined),
) => {
  render(<MyEvents events={events} onCancel={onCancel} />);
  return { onCancel, user: userEvent.setup() };
};

describe("MyEvents", () => {
  it("explains what the section is and says so when there is nothing yet", () => {
    setup([]);

    expect(
      screen.getByRole("heading", { name: "Mis eventos y cursos" }),
    ).toBeTruthy();
    expect(
      screen.getByText(/donde tienes un lugar y a los que ya asististe/),
    ).toBeTruthy();
    expect(screen.getByText(/Aún no te has inscrito/)).toBeTruthy();
    expect(screen.queryByRole("heading", { name: "Tengo lugar" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Asistí" })).toBeNull();
  });

  it("splits where I have a place from where I already went, each event once", () => {
    setup([withTicket, secondPlace, wentToService, wentWithTicket]);

    const place = screen.getByRole("list", { name: "Tengo lugar" });
    expect(
      within(place)
        .getByRole("link", { name: "Curso de discipulado" })
        .getAttribute("href"),
    ).toBe("/e/abc");
    expect(
      within(place).getByRole("link", { name: "Retiro de jóvenes" }),
    ).toBeTruthy();
    expect(within(place).queryByText("Culto dominical")).toBeNull();
    const went = screen.getByRole("list", { name: "Asistí" });
    expect(
      within(went).getByRole("link", { name: "Culto dominical" }),
    ).toBeTruthy();
    // Went with a ticket: it is in "Asistí" only.
    expect(
      within(went).getByRole("link", { name: "Taller de música" }),
    ).toBeTruthy();
    expect(within(place).queryByText("Taller de música")).toBeNull();
    expect(within(went).getAllByText("Asististe")).toHaveLength(2);
  });

  it("says why each place is mine: its ticket and that it is confirmed", () => {
    setup([withTicket, secondPlace]);

    const [first, second] = within(
      screen.getByRole("list", { name: "Tengo lugar" }),
    ).getAllByRole("listitem");
    expect(
      within(first as HTMLElement).getByText(
        /Curso · Sede Norte · 2 de febrero 2030 · General/,
      ),
    ).toBeTruthy();
    expect(within(first as HTMLElement).getByText("Confirmado")).toBeTruthy();
    expect(within(second as HTMLElement).getByText("Confirmado")).toBeTruthy();
  });

  it("shows the ticket QR of a confirmed place and hides it again", async () => {
    const { user } = setup([withTicket]);

    await user.click(
      screen.getByRole("button", {
        name: "Ver mi ticket de Curso de discipulado",
      }),
    );
    expect(
      await screen.findByRole("img", {
        name: "QR de mi ticket de Curso de discipulado",
      }),
    ).toBeTruthy();
    await user.click(
      screen.getByRole("button", {
        name: "Ocultar mi ticket de Curso de discipulado",
      }),
    );

    expect(screen.queryByRole("img", { name: /QR de mi ticket/ })).toBeNull();
  });

  it("asks before giving a place up, then cancels with its code", async () => {
    const { onCancel, user } = setup([withTicket]);

    await user.click(
      screen.getByRole("button", {
        name: "Cancelar mi inscripción a Curso de discipulado",
      }),
    );
    expect(
      screen.getByText(/¿Cancelar tu inscripción a «Curso de discipulado»\?/),
    ).toBeTruthy();
    expect(onCancel).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Sí, cancelar" }));

    expect(onCancel).toHaveBeenCalledWith("cancel-1");
  });

  it("keeps the place when the user says no", async () => {
    const { onCancel, user } = setup([withTicket]);

    await user.click(
      screen.getByRole("button", {
        name: "Cancelar mi inscripción a Curso de discipulado",
      }),
    );
    await user.click(screen.getByRole("button", { name: "No" }));

    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.queryByText(/¿Cancelar tu inscripción/)).toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Cancelar mi inscripción a Curso de discipulado",
      }),
    ).toBeTruthy();
  });

  it("closes the question when cancelling fails, so the user can try again", async () => {
    const { user } = setup(
      [withTicket],
      vi.fn().mockRejectedValue(new Error("boom")),
    );

    await user.click(
      screen.getByRole("button", {
        name: "Cancelar mi inscripción a Curso de discipulado",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Sí, cancelar" }));

    expect(screen.queryByText(/¿Cancelar tu inscripción/)).toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Cancelar mi inscripción a Curso de discipulado",
      }),
    ).toBeTruthy();
  });

  describe("a sub-event that comes with the place in a mega event", () => {
    const subEvent: MyEventResponse = {
      ...withTicket,
      title: "Taller de liderazgo",
      slug: "taller",
      isACourse: false,
      parentTitle: "Congreso",
    };

    it("says which event it is part of", () => {
      setup([subEvent]);

      expect(screen.getByText(/Parte de «Congreso»/)).toBeInTheDocument();
    });

    it("warns that cancelling gives the place up in the whole mega event", async () => {
      const { onCancel, user } = setup([subEvent]);

      await user.click(
        screen.getByRole("button", {
          name: "Cancelar mi inscripción a Taller de liderazgo",
        }),
      );

      expect(
        screen.getByText(
          /cancelarla te quita el lugar en todo el evento y sus sub-eventos/,
        ),
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Sí, cancelar" }));
      expect(onCancel).toHaveBeenCalledWith("cancel-1");
    });
  });
});
