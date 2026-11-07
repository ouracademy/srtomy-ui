import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  RegistrationOutcomeResponse,
  SharedEventResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { SharedEventPage, type SignUp } from "./SharedEventPage";

afterEach(cleanup);

const registration = {
  open: true,
  requiresAccount: false,
  soldOut: false,
  tickets: [
    {
      id: "t1",
      name: "General",
      priceCents: 0,
      currency: "PEN",
      onSale: true,
      remaining: 12,
    },
    {
      id: "t2",
      name: "VIP",
      priceCents: 2500,
      currency: "PEN",
      onSale: true,
      remaining: 1,
    },
    {
      id: "t3",
      name: "Anticipada",
      priceCents: 1000,
      currency: "PEN",
      onSale: false,
    },
  ],
};

const course: SharedEventResponse = {
  title: "Curso de discipulado",
  description: "Ocho semanas de estudio",
  address: "Av. 1",
  start: new Date(2030, 0, 5, 19, 0),
  end: new Date(2030, 0, 5, 21, 0),
  isACourse: true,
  organizationName: "Jóvenes",
  registration,
  canRegister: true,
};

const confirmed: RegistrationOutcomeResponse = {
  alreadyRegistered: false,
  status: "CONFIRMED",
  cancelCode: "cancel-code",
  ticketCode: "ticket-code",
};

const setup = (
  props: {
    event?: SharedEventResponse;
    onRegister?: (
      values: SignUp,
    ) => Promise<RegistrationOutcomeResponse | string>;
    onCancel?: (code: string) => Promise<boolean>;
    signedIn?: boolean;
    defaults?: { firstName?: string; lastName?: string; email?: string };
  } = {},
) => {
  const handlers = {
    onRegister: vi.fn<
      (values: SignUp) => Promise<RegistrationOutcomeResponse | string>
    >(props.onRegister ?? (() => Promise.resolve(confirmed))),
    onCancel: vi.fn<(code: string) => Promise<boolean>>(
      props.onCancel ?? (() => Promise.resolve(true)),
    ),
    onSignIn: vi.fn(),
    onCopy: vi.fn(),
  };
  render(
    <SharedEventPage
      event={props.event ?? course}
      signedIn={props.signedIn}
      defaults={props.defaults}
      cancelLink={(code) => `https://app.test/e/abc/cancelar/${code}`}
      {...handlers}
    />,
  );
  return { ...handlers, user: userEvent.setup() };
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

  it("offers each ticket with its price and the seats left", () => {
    setup();

    const tickets = screen.getByRole("radiogroup", { name: "Tipo de ticket" });
    expect(
      within(tickets).getByRole("radio", {
        name: "General · Gratis · Quedan 12 lugares",
      }),
    ).toBeTruthy();
    expect(
      within(tickets).getByRole("radio", {
        name: "VIP · S/ 25.00 · Queda 1 lugar",
      }),
    ).toBeTruthy();
    const closed = within(tickets).getByRole("radio", {
      name: "Anticipada · S/ 10.00 · Venta cerrada",
    });
    expect((closed as HTMLInputElement).disabled).toBe(true);
    expect(
      (
        within(tickets).getByRole("radio", {
          name: /^General/,
        }) as HTMLInputElement
      ).checked,
    ).toBe(true);
  });

  it("signs up with the chosen ticket and the data, then shows the ticket QR", async () => {
    const { onRegister, user } = setup();

    await user.click(screen.getByRole("radio", { name: /^VIP/ }));
    await fill(user);
    await user.type(screen.getByLabelText("Teléfono"), "999");
    await user.click(screen.getByRole("button", { name: "Inscribirme" }));

    expect(onRegister).toHaveBeenCalledWith({
      ticketTypeId: "t2",
      firstName: "Lucía",
      lastName: "Mora",
      email: "lucia@x.org",
      phoneNumber: "999",
    });
    expect(
      await screen.findByText("Listo, quedó inscrito. Gracias."),
    ).toBeTruthy();
    expect(
      await screen.findByRole("img", { name: "QR de su ticket" }),
    ).toBeTruthy();
    expect(screen.queryByRole("form", { name: "Inscripción" })).toBeNull();
  });

  it("gives the link to cancel and copies it", async () => {
    const { onCopy, user } = setup();

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Inscribirme" }));

    const link = await screen.findByLabelText("Enlace para cancelar");
    expect((link as HTMLInputElement).value).toBe(
      "https://app.test/e/abc/cancelar/cancel-code",
    );
    await user.click(screen.getByRole("button", { name: "Copiar enlace" }));
    expect(onCopy).toHaveBeenCalledWith(
      "https://app.test/e/abc/cancelar/cancel-code",
    );
  });

  it("cancels the sign-up with the code it got", async () => {
    const { onCancel, user } = setup();

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Inscribirme" }));
    await user.click(
      await screen.findByRole("button", { name: "Cancelar mi inscripción" }),
    );

    expect(onCancel).toHaveBeenCalledWith("cancel-code");
    expect(await screen.findByText("Su inscripción se canceló.")).toBeTruthy();
    expect(screen.queryByRole("img", { name: "QR de su ticket" })).toBeNull();
  });

  it("keeps the sign-up when cancelling fails", async () => {
    const { user } = setup({ onCancel: () => Promise.resolve(false) });

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Inscribirme" }));
    await user.click(
      await screen.findByRole("button", { name: "Cancelar mi inscripción" }),
    );

    expect(screen.queryByText("Su inscripción se canceló.")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Cancelar mi inscripción" }),
    ).toBeTruthy();
  });

  it("says the seats ran out and offers no form when everything is sold out", () => {
    const soldOut = {
      ...registration,
      soldOut: true,
      tickets: [{ ...registration.tickets[0], remaining: 0 }],
    };
    setup({ event: { ...course, registration: soldOut } });

    expect(screen.getByText("Se agotaron los lugares.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Inscribirme" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /lista de espera/ }),
    ).toBeNull();
  });

  it("does not let anyone pick a sold out ticket", () => {
    const soldOut = {
      ...registration,
      tickets: [{ ...registration.tickets[0], remaining: 0 }],
    };
    setup({ event: { ...course, registration: soldOut } });

    expect(
      (screen.getByRole("radio", { name: /^General/ }) as HTMLInputElement)
        .disabled,
    ).toBe(true);
    expect(screen.getByText("General · Gratis · Agotado")).toBeTruthy();
  });

  it("says when that email was already signed up", async () => {
    const { user } = setup({
      onRegister: () =>
        Promise.resolve({ ...confirmed, alreadyRegistered: true }),
    });

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Inscribirme" }));

    expect(
      await screen.findByText("Ya estaba inscrito con ese correo."),
    ).toBeTruthy();
  });

  it("shows why the API refused and keeps the form", async () => {
    const { user } = setup({
      onRegister: () => Promise.resolve("La inscripción está cerrada"),
    });

    await fill(user);
    await user.click(screen.getByRole("button", { name: "Inscribirme" }));

    expect(await screen.findByText("La inscripción está cerrada")).toBeTruthy();
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
    setup({
      defaults: { firstName: "Ana", lastName: "Paz", email: "ana@x.org" },
    });

    expect((screen.getByLabelText(/Nombre/) as HTMLInputElement).value).toBe(
      "Ana",
    );
    expect((screen.getByLabelText(/Correo/) as HTMLInputElement).value).toBe(
      "ana@x.org",
    );
  });

  it("has no form when the event takes no sign-ups", () => {
    setup({
      event: { ...course, registration: undefined, canRegister: false },
    });

    expect(screen.queryByRole("form", { name: "Inscripción" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Inscribirme" })).toBeNull();
    expect(screen.queryByText("La inscripción está cerrada.")).toBeNull();
  });

  it("says when the registration is closed", () => {
    setup({
      event: {
        ...course,
        registration: { ...registration, open: false },
        canRegister: false,
      },
    });

    expect(screen.getByText("La inscripción está cerrada.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Inscribirme" })).toBeNull();
  });

  it("asks someone who is not signed in to sign in when the registration needs an account", async () => {
    const { onSignIn, user } = setup({
      event: {
        ...course,
        registration: { ...registration, requiresAccount: true },
        canRegister: false,
      },
    });

    expect(screen.queryByRole("button", { name: "Inscribirme" })).toBeNull();
    await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(onSignIn).toHaveBeenCalledOnce();
  });

  it("says so when the person already has a place", () => {
    setup({
      event: {
        ...course,
        canRegister: false,
        registrationStatus: "CONFIRMED",
      },
    });

    expect(screen.getByText(/Ya tiene un lugar en este curso\./)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Inscribirme" })).toBeNull();
  });

  it("an event that is not a course is called an event", () => {
    setup({
      event: {
        ...course,
        isACourse: false,
        registration: undefined,
        canRegister: false,
      },
    });

    expect(screen.getByText("Evento · Jóvenes")).toBeTruthy();
  });

  describe("a composite event", () => {
    it("lists the program of a mega event and what each sub-event needs", () => {
      setup({
        event: {
          ...course,
          title: "Congreso",
          program: [
            {
              slug: "taller",
              title: "Taller",
              start: new Date(2030, 0, 5, 9, 0),
              end: new Date(2030, 0, 5, 11, 0),
              isACourse: false,
              registrationMode: "INHERIT",
              includedInTicket: true,
            },
          ],
        },
      });

      const program = screen.getByRole("region", { name: "Programa" });
      expect(
        within(program).getByRole("link", { name: /Taller/ }),
      ).toHaveAttribute("href", "/e/taller");
      expect(
        within(program).getByText("Incluido en tu inscripción"),
      ).toBeInTheDocument();
    });

    it("sends the visitor of a sub-event that inherits to sign up in its mega event", () => {
      setup({
        event: {
          ...course,
          canRegister: false,
          container: { slug: "congreso", title: "Congreso" },
        },
      });

      expect(
        screen.getByText(/Para tener un lugar, inscríbase allá/),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Ver «Congreso»" }),
      ).toHaveAttribute("href", "/e/congreso");
      expect(screen.queryByRole("form", { name: "Inscripción" })).toBeNull();
    });

    it("lets a sub-event with its own registration be signed up for", () => {
      setup({
        event: {
          ...course,
          canRegister: true,
          container: { slug: "congreso", title: "Congreso" },
        },
      });

      expect(screen.getByText(/Forma parte de «Congreso»/)).toBeInTheDocument();
      expect(screen.queryByText(/inscríbase allá/)).toBeNull();
      expect(
        screen.getByRole("form", { name: "Inscripción" }),
      ).toBeInTheDocument();
    });
  });
});
