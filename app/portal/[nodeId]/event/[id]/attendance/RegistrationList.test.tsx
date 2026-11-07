import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  EventRegistrationResponse,
  EventRegistrationSetupResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { RegistrationList } from "./RegistrationList";
import type { RegistrationActions } from "./useRegistration";

const reg = vi.hoisted(() => ({
  setup: undefined as unknown,
  registrations: [] as unknown[],
  checkIn: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("./useRegistration", () => ({
  useRegistration: () => ({
    setup: reg.setup,
    registrations: reg.registrations,
    checkIn: reg.checkIn,
    remove: reg.remove,
  }),
}));

const setup: EventRegistrationSetupResponse = {
  enabled: true,
  open: true,
  confirmed: 3,
  tickets: [
    { id: "t1", name: "General", priceCents: 0, quantity: 10, sold: 2 },
    {
      id: "t2",
      name: "Taller",
      priceCents: 2500,
      sold: 1,
      subEventIds: ["c1"],
    },
    { id: "t3", name: "Vacío", priceCents: 0, sold: 0 },
  ],
};
const registrations: EventRegistrationResponse[] = [
  {
    id: "r1",
    firstName: "Lucía",
    lastName: "Mora",
    email: "lucia@x.org",
    phoneNumber: "999",
    ticketName: "General",
    checkedInAt: new Date(2026, 2, 1, 10, 5),
  },
  { id: "r2", firstName: "Ana", lastName: "Paz", ticketName: "General" },
  { id: "r3", firstName: "Eva", lastName: "Sol", ticketName: "Taller" },
  { id: "r4", firstName: "Sin", lastName: "Ticket", ticketName: "Borrado" },
];

beforeEach(() => {
  reg.setup = setup;
  reg.registrations = registrations;
  reg.checkIn.mockReset().mockResolvedValue(undefined);
  reg.remove.mockReset().mockResolvedValue(undefined);
});
afterEach(cleanup);

const show = (can: Partial<RegistrationActions> = {}) => {
  render(
    <RegistrationList
      eventId="e1"
      subEvents={[{ id: "c1", title: "Taller de música" }]}
      can={{
        configure: true,
        close: true,
        remove: true,
        checkIn: true,
        ...can,
      }}
    />,
  );
  return userEvent.setup();
};

describe("RegistrationList", () => {
  it("lists who signed up under each ticket with what it sold", () => {
    show();

    const list = screen.getByRole("region", { name: "Inscritos" });
    expect(list).toHaveTextContent("3 confirmados");
    expect(list).toHaveTextContent("2 de 10");
    expect(list).toHaveTextContent("da acceso a: Taller de música");
    expect(list).toHaveTextContent("Lucía Mora");
    expect(list).toHaveTextContent("lucia@x.org · 999");
    expect(list).toHaveTextContent("Eva Sol");
    expect(within(list).getByText("Aún no hay inscritos.")).toBeVisible();
  });

  it("says whether each one came in, and when", () => {
    show();

    expect(screen.getByText(/Ingresó a las/)).toBeVisible();
    expect(screen.getAllByText("Aún no").length).toBeGreaterThan(0);
  });

  it("keeps whoever has a ticket that no longer exists", () => {
    show();

    expect(screen.getByText("Otros")).toBeVisible();
    expect(screen.getByText("Sin Ticket")).toBeVisible();
  });

  it("marks who came, takes the mark back and removes a sign-up", async () => {
    const user = show();

    await user.click(
      screen.getByRole("button", { name: "Marcar el ingreso de Ana Paz" }),
    );
    expect(reg.checkIn).toHaveBeenCalledWith("r2", true);
    await user.click(
      screen.getByRole("button", { name: "Quitar el ingreso de Lucía Mora" }),
    );
    expect(reg.checkIn).toHaveBeenCalledWith("r1", false);
    await user.click(
      screen.getByRole("button", { name: "Quitar la inscripción de Ana Paz" }),
    );
    expect(reg.remove).toHaveBeenCalledWith("r2");
  });

  it("hides the buttons from who has no permission", () => {
    show({ checkIn: false, remove: false });

    expect(screen.queryByRole("button", { name: /ingreso de/ })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Quitar la inscripción/ }),
    ).toBeNull();
    expect(screen.getByText("Lucía Mora")).toBeVisible();
  });

  it("shows nothing when the event has no sign-up", () => {
    reg.setup = { enabled: false };
    const { container } = render(
      <RegistrationList
        eventId="e1"
        can={{ configure: true, close: true, remove: true, checkIn: true }}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
