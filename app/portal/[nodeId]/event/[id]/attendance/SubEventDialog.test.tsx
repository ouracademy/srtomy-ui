import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SubEventDialog } from "./SubEventDialog";

const api = vi.hoisted(() => ({
  postEvents: vi.fn(),
  putEventsByIdRegistration: vi.fn(),
}));

vi.mock("@/app/(api)/generated", () => ({
  postEvents: (...args: unknown[]) => api.postEvents(...args),
  putEventsByIdRegistration: (...args: unknown[]) =>
    api.putEventsByIdRegistration(...args),
  useGetOrganizationsById: () => ({ data: undefined }),
  useGetPeople: () => ({ data: undefined }),
}));

const parent: EventResponse = {
  id: "mega",
  title: "Congreso",
  start: new Date(2026, 9, 23, 9, 0),
  end: new Date(2026, 9, 25, 18, 0),
  organization: { id: "sede" },
};

const showMessage = vi.fn();
const close = vi.fn();
const created = vi.fn();

const setup = () => {
  const user = userEvent.setup();
  render(
    <SnackbarContext.Provider value={{ message: "", showMessage }}>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <SubEventDialog
          nodeId="n1"
          parent={parent}
          open
          close={close}
          created={created}
          showRegistration
        />
      </LocalizationProvider>
    </SnackbarContext.Provider>,
  );
  return user;
};

beforeEach(() => {
  api.postEvents.mockReset().mockResolvedValue("hijo");
  api.putEventsByIdRegistration.mockReset().mockResolvedValue({});
  showMessage.mockReset();
  close.mockReset();
  created.mockReset();
});
afterEach(cleanup);

describe("SubEventDialog", () => {
  it("says which event the new one is part of", () => {
    setup();

    expect(
      screen.getByRole("dialog", { name: "Agregar sub-evento" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Parte de «Congreso»")).toBeInTheDocument();
  });

  it("saves it inside its parent, in the node of its parent and with its registration", async () => {
    const user = setup();
    await user.type(screen.getByPlaceholderText("Agregar título"), "Taller");

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(api.postEvents).toHaveBeenCalledOnce());
    expect(api.postEvents.mock.calls[0]?.[0]).toMatchObject({
      name: "Taller",
      parentEventId: "mega",
      organizationId: "sede",
      registrationMode: "INHERIT",
      isACourse: false,
    });
    expect(api.postEvents.mock.calls[0]?.[0].startTime).toMatch(
      /^2026-10-23T09:00:00/,
    );
    expect(api.putEventsByIdRegistration).not.toHaveBeenCalled();
    await waitFor(() => expect(created).toHaveBeenCalledOnce());
    expect(close).toHaveBeenCalledOnce();
    expect(showMessage).toHaveBeenCalledWith("Guardado exitosamente");
  });

  it("can be a course that needs no sign-up", async () => {
    const user = setup();
    await user.type(screen.getByPlaceholderText("Agregar título"), "Culto");
    await user.click(screen.getByRole("button", { name: "Curso" }));
    await user.click(screen.getByRole("combobox", { name: "Inscripción" }));
    await user.click(
      await screen.findByRole("option", { name: "Sin inscripción" }),
    );

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(api.postEvents).toHaveBeenCalledOnce());
    expect(api.postEvents.mock.calls[0]?.[0]).toMatchObject({
      isACourse: true,
      registrationMode: "OPEN",
    });
    expect(api.putEventsByIdRegistration).not.toHaveBeenCalled();
  });

  it("sets up its own registration when it has one", async () => {
    const user = setup();
    await user.type(screen.getByPlaceholderText("Agregar título"), "Cena");
    await user.click(screen.getByRole("combobox", { name: "Inscripción" }));
    await user.click(await screen.findByRole("option", { name: "Propia" }));
    await user.click(
      await screen.findByRole("switch", { name: "Pedir inscripción" }),
    );

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(api.putEventsByIdRegistration).toHaveBeenCalledOnce(),
    );
    expect(api.postEvents.mock.calls[0]?.[0].registrationMode).toBe("OWN");
    expect(api.putEventsByIdRegistration.mock.calls[0]?.[0]).toBe("hijo");
  });

  it("stays open and says so when the sub-event cannot be saved", async () => {
    api.postEvents.mockRejectedValue(new Error("no"));
    const user = setup();
    await user.type(screen.getByPlaceholderText("Agregar título"), "Taller");

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(showMessage).toHaveBeenCalledWith(
        "No se pudo guardar el sub-evento. Intenta de nuevo.",
      ),
    );
    expect(close).not.toHaveBeenCalled();
    expect(created).not.toHaveBeenCalled();
  });
});
