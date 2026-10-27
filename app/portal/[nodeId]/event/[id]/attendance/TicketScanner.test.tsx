import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CheckInResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { TicketScanner } from "./TicketScanner";

afterEach(cleanup);

const came: CheckInResponse = {
  registrationId: "r1",
  name: "Lucía Mora",
  ticketName: "General",
  alreadyCheckedIn: false,
};

const setup = (
  onCheckIn: (code: string) => Promise<CheckInResponse | string> = () =>
    Promise.resolve(came),
) => {
  const handler =
    vi.fn<(code: string) => Promise<CheckInResponse | string>>(onCheckIn);
  const close = vi.fn();
  render(<TicketScanner title="Curso" close={close} onCheckIn={handler} />);
  return { onCheckIn: handler, close, user: userEvent.setup() };
};

describe("TicketScanner", () => {
  it("tells browsers without a camera reader to type the code", () => {
    setup();

    expect(screen.getByText(/no puede leer QR con la cámara/)).toBeTruthy();
    expect(
      screen.getByRole("dialog", { name: "Escanear tickets de «Curso»" }),
    ).toBeTruthy();
  });

  it("checks a typed code in and shows who came", async () => {
    const { onCheckIn, user } = setup();

    await user.type(screen.getByLabelText("Código del ticket"), " abc123 ");
    await user.click(screen.getByRole("button", { name: "Validar" }));

    expect(onCheckIn).toHaveBeenCalledWith("abc123");
    const list = await screen.findByRole("list", { name: "Últimas lecturas" });
    expect(within(list).getByText("Lucía Mora (General) ingresó")).toBeTruthy();
    expect(
      (screen.getByLabelText("Código del ticket") as HTMLInputElement).value,
    ).toBe("");
  });

  it("says when that ticket had already come in", async () => {
    const { user } = setup(() =>
      Promise.resolve({
        ...came,
        alreadyCheckedIn: true,
        checkedInAt: new Date(2026, 2, 1, 10, 5),
      }),
    );

    await user.type(screen.getByLabelText("Código del ticket"), "abc");
    await user.click(screen.getByRole("button", { name: "Validar" }));

    expect(
      await screen.findByText(
        /Lucía Mora \(General\) ya había ingresado a las/,
      ),
    ).toBeTruthy();
  });

  it("shows why a ticket was refused", async () => {
    const { user } = setup(() =>
      Promise.resolve("Solo una inscripción confirmada puede ingresar"),
    );

    await user.type(screen.getByLabelText("Código del ticket"), "abc");
    await user.click(screen.getByRole("button", { name: "Validar" }));

    expect(
      await screen.findByText("Solo una inscripción confirmada puede ingresar"),
    ).toBeTruthy();
  });

  it("keeps the latest readings first", async () => {
    let n = 0;
    const { user } = setup(() => {
      n += 1;
      return Promise.resolve({ ...came, name: `Persona ${n}` });
    });

    for (const code of ["a", "b"]) {
      await user.type(screen.getByLabelText("Código del ticket"), code);
      await user.click(screen.getByRole("button", { name: "Validar" }));
      await screen.findByText(new RegExp(`Persona ${code === "a" ? 1 : 2}`));
    }

    const items = within(
      screen.getByRole("list", { name: "Últimas lecturas" }),
    ).getAllByRole("listitem");
    expect(items[0]?.textContent).toContain("Persona 2");
    expect(items[1]?.textContent).toContain("Persona 1");
  });

  it("does not send an empty code", () => {
    setup();

    expect(
      screen.getByRole("button", { name: "Validar" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("closes", async () => {
    const { close, user } = setup();

    await user.click(screen.getByRole("button", { name: "Cerrar" }));

    expect(close).toHaveBeenCalledOnce();
  });
});
