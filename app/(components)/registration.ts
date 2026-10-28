import type {
  EventRegistrationSetupRequest,
  EventRegistrationSetupResponse,
  TicketSetup,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";

// How an event or course takes sign-ups, as the forms edit it. Signing up is
// its own setup of the event; it has nothing to do with sharing the link.
//
// Off: the event takes no sign-ups (a Sunday service, for instance).
// On, with one ticket ("simple"): the organizers only say how many seats and,
// if they want, the price. The API gets one ticket called "General".
// On, with several tickets ("manyTickets"): each kind of ticket has its own
// name, price, quantity and sales window.
//
// The seats are only the quantity of each ticket. Closing the registration is
// an action of its own, not a field here.
export type RegistrationFormData = {
  enabled: boolean;
  requiresAccount: boolean;
  manyTickets: boolean;
  // Always at least one; in the simple form only the first one is used.
  tickets: TicketForm[];
};

export type TicketForm = {
  // Set when the ticket already exists; a ticket left out of the list is removed.
  id?: string;
  name: string;
  // In soles, as the user types it ("20", "20.50"); empty is free.
  price: string;
  // Empty is unlimited.
  quantity: string;
  // datetime-local values ("2026-03-01T09:00"); empty is no limit.
  salesStart: string;
  salesEnd: string;
};

export const FREE_TICKET_NAME = "General";

export const emptyTicket = (): TicketForm => ({
  name: "",
  price: "",
  quantity: "",
  salesStart: "",
  salesEnd: "",
});

export const noRegistration = (): RegistrationFormData => ({
  enabled: false,
  requiresAccount: false,
  manyTickets: false,
  tickets: [{ ...emptyTicket(), name: FREE_TICKET_NAME }],
});

const pad = (value: number) => String(value).padStart(2, "0");

const toLocalInput = (value?: Date): string => {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const fromLocalInput = (value: string): Date | undefined =>
  value ? new Date(value) : undefined;

const priceToText = (cents?: number): string =>
  !cents ? "" : (cents / 100).toFixed(2).replace(/\.00$/, "");

const textToCents = (text: string): number =>
  Math.round(Number(text.replace(",", ".")) * 100);

// A ticket the simple form can show: the one called General, with no sales
// window. Any other needs the list of tickets.
const isSimpleTicket = (ticket: TicketSetup): boolean =>
  ticket.name === FREE_TICKET_NAME && !ticket.salesStart && !ticket.salesEnd;

// What the API has, as the form edits it.
export const fromSetupResponse = (
  setup?: EventRegistrationSetupResponse,
): RegistrationFormData => {
  if (!setup?.enabled) return noRegistration();
  const tickets = setup.tickets ?? [];
  const only = tickets.length === 1 ? tickets[0] : undefined;
  return {
    enabled: true,
    requiresAccount: Boolean(setup.requiresAccount),
    manyTickets: !(only && isSimpleTicket(only)),
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      name: ticket.name ?? "",
      price: priceToText(ticket.priceCents),
      quantity: ticket.quantity ? String(ticket.quantity) : "",
      salesStart: toLocalInput(ticket.salesStart),
      salesEnd: toLocalInput(ticket.salesEnd),
    })),
  };
};

const wholeNumber = (text: string) => /^\d+$/.test(text.trim());

const ticketErrors = (ticket: TicketForm, label: string): string[] => {
  const errors: string[] = [];
  const price = ticket.price.trim().replace(",", ".");
  if (price && (Number.isNaN(Number(price)) || Number(price) < 0)) {
    errors.push(`${label}: el precio no es válido`);
  }
  if (
    ticket.quantity.trim() &&
    (!wholeNumber(ticket.quantity) || Number(ticket.quantity) < 1)
  ) {
    errors.push(`${label}: los cupos deben ser un número mayor que cero`);
  }
  return errors;
};

// Why the form cannot be saved, in the words of the screen; empty when it can.
export const registrationErrors = (form: RegistrationFormData): string[] => {
  if (!form.enabled) return [];
  if (!form.manyTickets) {
    return ticketErrors(form.tickets[0] ?? emptyTicket(), "Inscripción");
  }
  const errors: string[] = [];
  if (form.tickets.length === 0) {
    errors.push("Agregue al menos un tipo de ticket");
  }
  const names = new Set<string>();
  form.tickets.forEach((ticket, index) => {
    const label = `Ticket ${index + 1}`;
    const name = ticket.name.trim().toLowerCase();
    if (!name) {
      errors.push(`${label}: ingrese el nombre`);
    } else if (names.has(name)) {
      errors.push(`${label}: ya hay un ticket llamado «${ticket.name.trim()}»`);
    }
    names.add(name);
    errors.push(...ticketErrors(ticket, label));
    if (
      ticket.salesStart &&
      ticket.salesEnd &&
      new Date(ticket.salesStart) >= new Date(ticket.salesEnd)
    ) {
      errors.push(`${label}: la venta debe empezar antes de terminar`);
    }
  });
  return errors;
};

// What to send; null when the event takes no sign-ups.
export const toSetupRequest = (
  form: RegistrationFormData,
): EventRegistrationSetupRequest | null => {
  if (!form.enabled) return null;
  const requiresAccount = form.requiresAccount;
  const toTicket = (ticket: TicketForm, name: string) => ({
    id: ticket.id,
    name,
    priceCents: ticket.price.trim() ? textToCents(ticket.price) : 0,
    currency: "PEN",
    quantity: ticket.quantity.trim() ? Number(ticket.quantity) : undefined,
    salesStart: fromLocalInput(ticket.salesStart),
    salesEnd: fromLocalInput(ticket.salesEnd),
  });
  if (!form.manyTickets) {
    // Keeps the ticket that already exists so its sign-ups stay with it.
    const ticket = form.tickets[0] ?? emptyTicket();
    return {
      requiresAccount,
      tickets: [
        {
          ...toTicket(ticket, FREE_TICKET_NAME),
          salesStart: undefined,
          salesEnd: undefined,
        },
      ],
    };
  }
  return {
    requiresAccount,
    tickets: form.tickets.map((ticket) => toTicket(ticket, ticket.name.trim())),
  };
};

// The price of a ticket for the screen: "Gratis" or "S/ 20.50".
export const formatPrice = (cents = 0, currency = "PEN"): string => {
  if (cents === 0) return "Gratis";
  const symbol =
    currency === "PEN" ? "S/" : currency === "USD" ? "US$" : currency;
  return `${symbol} ${(cents / 100).toFixed(2)}`;
};

// How many seats are left, for the public page.
export const remainingLabel = (remaining?: number): string => {
  if (remaining === undefined || remaining === null) return "";
  if (remaining === 0) return "Agotado";
  return remaining === 1 ? "Queda 1 lugar" : `Quedan ${remaining} lugares`;
};
