import { describe, expect, it } from "vitest";
import type { EventRegistrationSetupResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import {
  emptyTicket,
  formatPrice,
  fromSetupResponse,
  noRegistration,
  registrationErrors,
  remainingLabel,
  toSetupRequest,
  type RegistrationFormData,
} from "./registration";

const tickets = (
  ...items: Partial<RegistrationFormData["tickets"][number]>[]
) => items.map((item) => ({ ...emptyTicket(), ...item }));

const on = (change: Partial<RegistrationFormData>): RegistrationFormData => ({
  ...noRegistration(),
  enabled: true,
  ...change,
});

describe("noRegistration", () => {
  it("is off, with the ticket the simple form would use", () => {
    const empty = noRegistration();

    expect(empty.enabled).toBe(false);
    expect(empty.manyTickets).toBe(false);
    expect(empty.tickets).toEqual([{ ...emptyTicket(), name: "General" }]);
  });
});

describe("fromSetupResponse", () => {
  it("is off when the event has no registration", () => {
    expect(fromSetupResponse(undefined).enabled).toBe(false);
    expect(fromSetupResponse({ enabled: false }).enabled).toBe(false);
  });

  it("one ticket called General is the simple form: seats and price", () => {
    const setup: EventRegistrationSetupResponse = {
      enabled: true,
      open: true,
      tickets: [{ id: "t1", name: "General", priceCents: 1500, quantity: 30 }],
    };

    const result = fromSetupResponse(setup);

    expect(result.enabled).toBe(true);
    expect(result.manyTickets).toBe(false);
    expect(result.tickets[0]).toMatchObject({
      id: "t1",
      price: "15",
      quantity: "30",
    });
  });

  it("a ticket with another name or a sales window needs the list of tickets", () => {
    expect(
      fromSetupResponse({
        enabled: true,
        tickets: [{ id: "t1", name: "Entrada", priceCents: 0 }],
      }).manyTickets,
    ).toBe(true);
    expect(
      fromSetupResponse({
        enabled: true,
        tickets: [
          {
            id: "t1",
            name: "General",
            priceCents: 0,
            salesStart: new Date(2026, 2, 1),
          },
        ],
      }).manyTickets,
    ).toBe(true);
  });

  it("several tickets keep their prices in soles and the sales window", () => {
    const result = fromSetupResponse({
      enabled: true,
      open: false,
      requiresAccount: true,
      tickets: [
        { id: "t1", name: "General", priceCents: 0, quantity: 10 },
        {
          id: "t2",
          name: "VIP",
          priceCents: 2050,
          salesStart: new Date(2026, 2, 1, 9, 5),
        },
      ],
    });

    expect(result.manyTickets).toBe(true);
    expect(result.requiresAccount).toBe(true);
    expect(result.tickets[1]).toMatchObject({
      price: "20.50",
      quantity: "",
      salesStart: "2026-03-01T09:05",
    });
  });
});

describe("toSetupRequest", () => {
  it("is null when there is no registration", () => {
    expect(toSetupRequest(noRegistration())).toBeNull();
  });

  it("the simple form is one ticket General with the seats and the price", () => {
    const request = toSetupRequest(
      on({
        tickets: tickets({
          id: "t1",
          name: "lo que sea",
          quantity: "40",
          price: "12,50",
        }),
      }),
    );

    expect(request).toEqual({
      requiresAccount: false,
      tickets: [
        {
          id: "t1",
          name: "General",
          priceCents: 1250,
          currency: "PEN",
          quantity: 40,
          salesStart: undefined,
          salesEnd: undefined,
        },
      ],
    });
  });

  it("without seats there is no limit, and without price it is free", () => {
    const request = toSetupRequest(on({}));

    expect(request?.tickets[0]).toMatchObject({ priceCents: 0 });
    expect(request?.tickets[0]?.quantity).toBeUndefined();
  });

  it("asks for an account only when told to", () => {
    expect(toSetupRequest(on({ requiresAccount: true }))?.requiresAccount).toBe(
      true,
    );
  });

  it("converts prices to cents and the sales window to dates", () => {
    const request = toSetupRequest(
      on({
        manyTickets: true,
        tickets: tickets(
          { name: " General ", price: "", quantity: "20" },
          {
            name: "VIP",
            price: "20,50",
            salesStart: "2026-03-01T09:00",
            salesEnd: "2026-03-02T18:30",
          },
        ),
      }),
    );

    expect(request?.tickets).toHaveLength(2);
    expect(request?.tickets[0]).toMatchObject({
      name: "General",
      priceCents: 0,
      quantity: 20,
    });
    expect(request?.tickets[1]).toMatchObject({
      name: "VIP",
      priceCents: 2050,
    });
    expect(request?.tickets[1]?.salesStart).toEqual(
      new Date("2026-03-01T09:00"),
    );
    expect(request?.tickets[1]?.salesEnd).toEqual(new Date("2026-03-02T18:30"));
  });

  it("round trips what the API gave", () => {
    const setup: EventRegistrationSetupResponse = {
      enabled: true,
      open: true,
      requiresAccount: true,
      tickets: [
        { id: "t1", name: "General", priceCents: 0, quantity: 30 },
        { id: "t2", name: "VIP", priceCents: 2500 },
      ],
    };

    const request = toSetupRequest(fromSetupResponse(setup));

    expect(request?.requiresAccount).toBe(true);
    expect(
      request?.tickets.map((ticket) => [ticket.id, ticket.priceCents]),
    ).toEqual([
      ["t1", 0],
      ["t2", 2500],
    ]);
  });

  it("never sends what is no longer offered", () => {
    const request = toSetupRequest(on({}));

    expect(Object.keys(request ?? {}).sort()).toEqual([
      "requiresAccount",
      "tickets",
    ]);
  });
});

describe("registrationErrors", () => {
  it("has none when it is off or the form is good", () => {
    expect(registrationErrors(noRegistration())).toEqual([]);
    expect(registrationErrors(on({}))).toEqual([]);
    expect(
      registrationErrors(
        on({ manyTickets: true, tickets: tickets({ name: "General" }) }),
      ),
    ).toEqual([]);
  });

  it("the simple form needs good seats and a good price", () => {
    expect(
      registrationErrors(on({ tickets: tickets({ quantity: "0" }) })),
    ).toEqual(["Inscripción: los cupos deben ser un número mayor que cero"]);
    expect(
      registrationErrors(on({ tickets: tickets({ price: "abc" }) })),
    ).toEqual(["Inscripción: el precio no es válido"]);
  });

  it("several tickets need a name each, and distinct names", () => {
    expect(
      registrationErrors(on({ manyTickets: true, tickets: [] })),
    ).toContain("Agregue al menos un tipo de ticket");
    expect(
      registrationErrors(
        on({ manyTickets: true, tickets: tickets({ name: " " }) }),
      ),
    ).toContain("Ticket 1: ingrese el nombre");
    expect(
      registrationErrors(
        on({
          manyTickets: true,
          tickets: tickets({ name: "VIP" }, { name: " vip " }),
        }),
      ),
    ).toContain("Ticket 2: ya hay un ticket llamado «vip»");
  });

  it("checks price, seats and the sales window of each ticket", () => {
    const errors = registrationErrors(
      on({
        manyTickets: true,
        tickets: tickets({
          name: "A",
          price: "abc",
          quantity: "0",
          salesStart: "2026-03-02T09:00",
          salesEnd: "2026-03-01T09:00",
        }),
      }),
    );

    expect(errors).toEqual([
      "Ticket 1: el precio no es válido",
      "Ticket 1: los cupos deben ser un número mayor que cero",
      "Ticket 1: la venta debe empezar antes de terminar",
    ]);
  });
});

describe("formatPrice and remainingLabel", () => {
  it("shows Gratis, soles and other currencies", () => {
    expect(formatPrice(0)).toBe("Gratis");
    expect(formatPrice(undefined)).toBe("Gratis");
    expect(formatPrice(2050, "PEN")).toBe("S/ 20.50");
    expect(formatPrice(1000, "USD")).toBe("US$ 10.00");
    expect(formatPrice(500, "EUR")).toBe("EUR 5.00");
  });

  it("says how many seats are left", () => {
    expect(remainingLabel(undefined)).toBe("");
    expect(remainingLabel(0)).toBe("Agotado");
    expect(remainingLabel(1)).toBe("Queda 1 lugar");
    expect(remainingLabel(7)).toBe("Quedan 7 lugares");
  });
});
