import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  AttendanceWelcomeResponse,
  SelfAttendanceResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { AttendanceSelfPage } from "./AttendanceSelfPage";

afterEach(cleanup);

const welcome: AttendanceWelcomeResponse = {
  title: "Culto dominical",
  start: new Date(2030, 0, 6, 10, 0),
  organizationName: "Iglesia Central",
  status: "OPEN",
};

const setup = (
  props: {
    welcome?: AttendanceWelcomeResponse;
    signedIn?: boolean;
    onMark?: (name: string) => Promise<SelfAttendanceResponse | string>;
  } = {},
) => {
  const onMark = vi.fn<
    (name: string) => Promise<SelfAttendanceResponse | string>
  >(
    props.onMark ??
      (() => Promise.resolve({ kind: "ANONYMOUS", alreadyMarked: false })),
  );
  const onSignIn = vi.fn();
  render(
    <AttendanceSelfPage
      welcome={props.welcome ?? welcome}
      signedIn={props.signedIn ?? false}
      onSignIn={onSignIn}
      onMark={onMark}
    />,
  );
  return { onMark, onSignIn, user: userEvent.setup() };
};

describe("AttendanceSelfPage", () => {
  it("shows the event whose QR was scanned", () => {
    setup();

    expect(
      screen.getByRole("heading", { name: "Culto dominical", level: 1 }),
    ).toBeTruthy();
    expect(screen.getByText("Asistencia · Iglesia Central")).toBeTruthy();
    expect(screen.getByText(/domingo 6 de enero, 10:00/)).toBeTruthy();
  });

  it("marks attendance without a name: just counted", async () => {
    const { onMark, user } = setup();

    await user.click(
      screen.getByRole("button", { name: "Marcar mi asistencia" }),
    );

    expect(onMark).toHaveBeenCalledWith("");
    expect(
      await screen.findByText("Gracias por venir. Contamos su asistencia."),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Marcar mi asistencia" }),
    ).toBeNull();
  });

  it("sends the name someone leaves", async () => {
    const { onMark, user } = setup({
      onMark: () => Promise.resolve({ kind: "VISITOR", alreadyMarked: false }),
    });

    await user.type(
      screen.getByLabelText("Su nombre (opcional)"),
      "  Rosa Díaz ",
    );
    await user.click(
      screen.getByRole("button", { name: "Marcar mi asistencia" }),
    );

    expect(onMark).toHaveBeenCalledWith("Rosa Díaz");
    expect(
      await screen.findByText(/Quedó registrado como visitante/),
    ).toBeTruthy();
  });

  it.each([
    [
      { kind: "PERSON", alreadyMarked: false },
      "Listo, quedó marcada su asistencia. Gracias por venir.",
    ],
    [
      { kind: "REGISTRATION", alreadyMarked: false },
      "Listo, ingresó con su ticket. Gracias por venir.",
    ],
    [
      { kind: "PERSON", alreadyMarked: true },
      "Ya estaba marcada su asistencia.",
    ],
  ] as const)("says how it went: %j", async (result, message) => {
    const { user } = setup({
      signedIn: true,
      onMark: () => Promise.resolve(result),
    });

    await user.click(
      screen.getByRole("button", { name: "Marcar mi asistencia" }),
    );

    expect(await screen.findByText(message)).toBeTruthy();
  });

  it("offers to sign in only to who is not signed in", async () => {
    const first = setup();
    await first.user.click(
      screen.getByRole("button", { name: "Ya tengo cuenta: iniciar sesión" }),
    );
    expect(first.onSignIn).toHaveBeenCalledOnce();
    cleanup();

    setup({ signedIn: true });
    expect(
      screen.queryByRole("button", { name: "Ya tengo cuenta: iniciar sesión" }),
    ).toBeNull();
  });

  it("shows why it failed and lets the user try again", async () => {
    const { user } = setup({
      onMark: () =>
        Promise.resolve("El código venció: pida al ujier que muestre el nuevo"),
    });

    await user.click(
      screen.getByRole("button", { name: "Marcar mi asistencia" }),
    );

    expect(await screen.findByText(/El código venció/)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Marcar mi asistencia" }),
    ).toBeTruthy();
  });

  it("asks for the current QR when the code expired", () => {
    setup({ welcome: { ...welcome, status: "EXPIRED_CODE" } });

    expect(screen.getByText(/Este código venció/)).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Marcar mi asistencia" }),
    ).toBeNull();
  });

  it("does not take attendance of an event that is not on", () => {
    setup({ welcome: { ...welcome, status: "OUT_OF_WINDOW" } });

    expect(
      screen.getByText("Este evento no está tomando asistencia ahora."),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Marcar mi asistencia" }),
    ).toBeNull();
  });
});
