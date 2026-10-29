import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EventResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { SnackbarContext } from "@/app/(components)/SnackbarContext";
import { EditableEventForm, savedMessage } from "./EditableEventForm";

const { putEventsById } = vi.hoisted(() => ({ putEventsById: vi.fn() }));

vi.mock("@/app/(api)/generated", () => ({
  putEventsById,
  useGetOrganizationsById: () => ({ data: undefined }),
  useGetPeople: () => ({ data: undefined }),
}));
vi.mock("../../../person/PersonTable", () => ({
  fullName: (person: { firstName?: string; lastName?: string }) =>
    `${person.firstName} ${person.lastName}`,
}));

const NODE = "11111111-1111-1111-1111-111111111111";
const EVENT = "33333333-3333-3333-3333-333333333333";

beforeEach(() => {
  putEventsById.mockReset();
  putEventsById.mockResolvedValue({
    id: EVENT,
    keptEvents: 0,
    notifiedPeople: 0,
  });
});
afterEach(cleanup);

const oneOff: EventResponse = {
  id: EVENT,
  title: "Retiro",
  start: new Date(2026, 1, 2, 15, 0),
  end: new Date(2026, 1, 2, 17, 0),
  address: "Av. Lima 1",
  description: "Retiro de jóvenes",
  isACourse: false,
  speakers: [{ id: "s1", firstName: "Ana", lastName: "Mena" }],
};

const series: EventResponse = {
  ...oneOff,
  recurrence: {
    seriesId: "44444444-4444-4444-4444-444444444444",
    frequency: "WEEKLY",
    interval: 1,
    daysOfWeek: [1],
    endType: "NEVER",
    timeZone: "America/Lima",
  },
};

const setup = (event: EventResponse, editing = true) => {
  const showMessage = vi.fn();
  const saved = vi.fn();
  const cancel = vi.fn();
  render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <SnackbarContext.Provider value={{ message: "", showMessage }}>
        <EditableEventForm
          nodeId={NODE}
          eventId={EVENT}
          event={event}
          editing={editing}
          cancel={cancel}
          saved={saved}
        />
      </SnackbarContext.Provider>
    </LocalizationProvider>,
  );
  return { showMessage, saved, cancel, user: userEvent.setup() };
};

const rename = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
) => {
  const title = screen.getByPlaceholderText("Agregar título");
  await user.clear(title);
  await user.type(title, name);
};

describe("EditableEventForm", () => {
  it("shows the event without a way to save it until it is edited", () => {
    setup(oneOff, false);

    expect(
      (screen.getByPlaceholderText("Agregar título") as HTMLInputElement).value,
    ).toBe("Retiro");
    // Disabled by the fieldset around the form.
    expect(
      screen.getByPlaceholderText("Agregar título").matches(":disabled"),
    ).toBe(true);
    expect(screen.queryByRole("button", { name: "Guardar" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Cancelar" })).toBeNull();
  });

  it("keeps the kind (event or course) from changing", () => {
    setup(oneOff);

    expect(
      (screen.getByRole("button", { name: "Curso" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("saves a single event right away when its schedule did not move", async () => {
    const { user, showMessage, saved } = setup(oneOff);

    await rename(user, "Retiro de jóvenes");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(putEventsById).toHaveBeenCalledTimes(1));
    const [id, body] = putEventsById.mock.calls[0] ?? [];
    expect(id).toBe(EVENT);
    expect(body).toMatchObject({
      name: "Retiro de jóvenes",
      organizationId: NODE,
      isACourse: false,
      speakerIds: ["s1"],
      option: "THIS_EVENT",
    });
    expect(body.recurrence).toBeUndefined();
    expect(showMessage).toHaveBeenCalledWith("Evento actualizado.");
    expect(saved).toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks which occurrences to edit for an event of a series and sends the choice", async () => {
    const { user, saved } = setup(series);

    await rename(user, "Culto");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    expect(putEventsById).not.toHaveBeenCalled();
    await user.click(screen.getByRole("radio", { name: "Todos los eventos" }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(putEventsById).toHaveBeenCalledTimes(1));
    const body = putEventsById.mock.calls[0]?.[1];
    expect(body.option).toBe("ALL_EVENTS");
    expect(body.name).toBe("Culto");
    // The rule did not change, so it is not sent (and neither is the zone).
    expect(body.recurrence).toBeUndefined();
    expect(body.timeZone).toBeUndefined();
    await waitFor(() => expect(saved).toHaveBeenCalled());
  });

  it("does not save when the user cancels the dialog", async () => {
    const { user } = setup(series);

    await rename(user, "Culto");
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(putEventsById).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("explains how to stop a series instead of saving no repetition", async () => {
    const { user, showMessage } = setup(series);

    await user.click(screen.getByRole("combobox", { name: "Se repite" }));
    await user.click(screen.getByRole("option", { name: "No se repite" }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(showMessage).toHaveBeenCalledWith(
      expect.stringContaining("elimina"),
    );
    expect(putEventsById).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the explanation of the API when saving fails, and stays editing", async () => {
    putEventsById.mockRejectedValue({
      isAxiosError: true,
      response: {
        data: { detail: "No se puede cambiar la iglesia, sede o grupo" },
      },
    });
    const { user, showMessage, saved } = setup(oneOff);

    await rename(user, "Otro");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(showMessage).toHaveBeenCalled());
    expect(showMessage).toHaveBeenCalledWith(
      "No se puede cambiar la iglesia, sede o grupo",
    );
    expect(saved).not.toHaveBeenCalled();
  });

  it("closes the editor with Cancelar", async () => {
    const { user, cancel } = setup(oneOff);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(cancel).toHaveBeenCalled();
  });
});

describe("savedMessage", () => {
  it("only says it was updated when nobody was told and nothing was kept", () => {
    expect(savedMessage({ id: EVENT, keptEvents: 0, notifiedPeople: 0 })).toBe(
      "Evento actualizado.",
    );
  });

  it("says how many people were emailed and how many events were left alone", () => {
    expect(savedMessage({ id: EVENT, keptEvents: 2, notifiedPeople: 1 })).toBe(
      "Evento actualizado. Se avisó por correo a 1 persona. 2 eventos con inscritos, asistencia o ya pasados no cambiaron.",
    );
    expect(savedMessage({ id: EVENT, keptEvents: 1, notifiedPeople: 3 })).toBe(
      "Evento actualizado. Se avisó por correo a 3 personas. 1 evento con inscritos, asistencia o ya pasados no cambiaron.",
    );
  });
});
