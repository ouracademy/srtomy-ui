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

const form = (change: Partial<RegistrationFormData>): RegistrationFormData => ({
  ...noRegistration(),
  mode: "TICKETS",
  ...change,
});

describe("fromSetupResponse", () => {
  it("is no registration when the event has none", () => {
    expect(fromSetupResponse(undefined).mode).toBe("NONE");
    expect(fromSetupResponse({ enabled: false }).mode).toBe("NONE");
  });

  it("recognizes a free event: one ticket called General without price or limits", () => {
    const setup: EventRegistrationSetupResponse = {
      enabled: true,
      open: true,
      capacity: 30,
      tickets: [{ id: "t1", name: "General", priceCents: 0 }],
    };

    const result = fromSetupResponse(setup);

    expect(result.mode).toBe("FREE");
    expect(result.capacity).toBe("30");
    expect(result.tickets[0]?.id).toBe("t1");
  });

  it("anything else is tickets, with prices in soles and the sales window", () => {
    const result = fromSetupResponse({
      enabled: true,
      open: false,
      requiresAccount: true,
      waitlistEnabled: true,
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

    expect(result.mode).toBe("TICKETS");
    expect(result.open).toBe(false);
    expect(result.requiresAccount).toBe(true);
    expect(result.waitlistEnabled).toBe(true);
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

  it("a free event is one ticket of price 0 and keeps the one it had", () => {
    const request = toSetupRequest({
      ...noRegistration(),
      mode: "FREE",
      capacity: "40",
      tickets: tickets({ id: "t1", name: "General" }),
    });

    expect(request).toEqual({
      open: true,
      requiresAccount: false,
      waitlistEnabled: false,
      capacity: 40,
      tickets: [{ id: "t1", name: "General", priceCents: 0, currency: "PEN" }],
    });
  });

  it("a free event without limits has no capacity", () => {
    expect(
      toSetupRequest({ ...noRegistration(), mode: "FREE" })?.capacity,
    ).toBeUndefined();
  });

  it("converts prices to cents and the sales window to dates", () => {
    const request = toSetupRequest(
      form({
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
      capacity: 50,
      tickets: [
        { id: "t1", name: "General", priceCents: 0, quantity: 30 },
        { id: "t2", name: "VIP", priceCents: 2500 },
      ],
    };

    const request = toSetupRequest(fromSetupResponse(setup));

    expect(request?.capacity).toBe(50);
    expect(
      request?.tickets.map((ticket) => [ticket.id, ticket.priceCents]),
    ).toEqual([
      ["t1", 0],
      ["t2", 2500],
    ]);
  });
});

describe("registrationErrors", () => {
  it("has none without registration or with a good setup", () => {
    expect(registrationErrors(noRegistration())).toEqual([]);
    expect(
      registrationErrors(form({ tickets: tickets({ name: "General" }) })),
    ).toEqual([]);
    expect(registrationErrors({ ...noRegistration(), mode: "FREE" })).toEqual(
      [],
    );
  });

  it("needs a ticket with a name, and distinct names", () => {
    expect(registrationErrors(form({ tickets: [] }))).toContain(
      "Agregue al menos un tipo de ticket",
    );
    expect(
      registrationErrors(form({ tickets: tickets({ name: " " }) })),
    ).toContain("Ticket 1: ingrese el nombre");
    expect(
      registrationErrors(
        form({ tickets: tickets({ name: "VIP" }, { name: " vip " }) }),
      ),
    ).toContain("Ticket 2: ya hay un ticket llamado «vip»");
  });

  it("checks price, quantity, capacity and the sales window", () => {
    const errors = registrationErrors(
      form({
        capacity: "0",
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
      "El cupo total debe ser un número mayor que cero",
      "Ticket 1: el precio no es válido",
      "Ticket 1: la cantidad debe ser un número mayor que cero",
      "Ticket 1: la venta debe empezar antes de terminar",
    ]);
  });

  it("a free event only needs a good capacity", () => {
    expect(
      registrationErrors({ ...noRegistration(), mode: "FREE", capacity: "x" }),
    ).toEqual(["El cupo total debe ser un número mayor que cero"]);
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
