import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventForm, EventDetailFormData } from "./EventForm";
import { noRecurrence } from "./recurrence";
import { noRegistration } from "./registration";

const api = vi.hoisted(() => ({ address: undefined as string | undefined }));

vi.mock("@/app/(api)/generated", () => ({
  useGetOrganizationsById: () => ({
    data: api.address ? { address: api.address } : undefined,
  }),
  useGetPeople: () => ({ data: undefined }),
}));

afterEach(() => {
  cleanup();
  api.address = undefined;
});

const initialValues: EventDetailFormData = {
  name: "",
  date: new Date(2026, 9, 23, 17, 9),
  endDate: new Date(2026, 9, 23, 17, 9),
  startTime: new Date(2026, 9, 23, 17, 9),
  endTime: new Date(2026, 9, 23, 18, 9),
  address: "",
  description: "",
  recurrence: noRecurrence(),
  type: 0,
  speakers: [],
  registration: noRegistration(),
};

// An editable form of a new event unless the props say otherwise.
const renderWith = (props: Partial<ComponentProps<typeof EventForm>> = {}) =>
  render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <EventForm
        nodeId="11111111-1111-1111-1111-111111111111"
        initialValues={initialValues}
        submit={vi.fn()}
        editable
        {...props}
      />
    </LocalizationProvider>,
  );

const renderForm = (
  submit: (values: EventDetailFormData) => void,
  showRegistration = false,
  values: EventDetailFormData = initialValues,
) => renderWith({ submit, showRegistration, initialValues: values });

describe("EventForm", () => {
  it("saves the end time the user changes in the end time picker", async () => {
    const submit = vi.fn();
    renderForm(submit);

    fireEvent.change(screen.getByPlaceholderText("Agregar título"), {
      target: { value: "Retiro" },
    });

    // Two time pickers render "Hours" sections: [0] start, [1] end.
    const endHours = screen.getAllByRole("spinbutton", { name: "Hours" })[1];
    if (!endHours) throw new Error("end time picker is not rendered");
    expect(endHours).toHaveTextContent("06");

    fireEvent.click(endHours);
    fireEvent.keyDown(endHours, { key: "ArrowUp" });
    expect(endHours).toHaveTextContent("07");

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    const values = submit.mock.calls[0]?.[0];
    expect(values?.endTime.getHours()).toBe(19);
    expect(values?.startTime.getHours()).toBe(17);
  });

  it("saves the event as a course when Curso is chosen", async () => {
    const submit = vi.fn();
    renderForm(submit);

    fireEvent.change(screen.getByPlaceholderText("Agregar título"), {
      target: { value: "Discipulado" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Curso" }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit.mock.calls[0]?.[0]?.type).toBe(1);
  });

  it("saves how the event repeats", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    renderForm(submit);

    await user.type(screen.getByPlaceholderText("Agregar título"), "Servicio");
    await user.click(screen.getByRole("combobox", { name: "Se repite" }));
    await user.click(screen.getByRole("option", { name: "Todos los días" }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit.mock.calls[0]?.[0]?.recurrence).toMatchObject({
      frequency: "DAILY",
      interval: 1,
      endType: "NEVER",
    });
  });

  it("does not save a weekly event without a weekday", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    renderForm(submit);

    await user.type(screen.getByPlaceholderText("Agregar título"), "Servicio");
    await user.click(screen.getByRole("combobox", { name: "Se repite" }));
    await user.click(screen.getByRole("option", { name: "Personalizar…" }));
    // The weekday of the event is selected; clear it.
    await user.click(screen.getByText("V"));
    await user.click(screen.getByRole("button", { name: "Listo" }));

    expect(
      await screen.findByText("Elige al menos un día de la semana"),
    ).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it("only describes the repetition when the form is not editable", () => {
    renderWith({
      initialValues: {
        ...initialValues,
        recurrence: { ...noRecurrence(), frequency: "DAILY" },
      },
      editable: false,
    });

    expect(screen.getByLabelText("Repetición")).toHaveTextContent(
      "Todos los días",
    );
    expect(
      screen.queryByRole("combobox", { name: "Se repite" }),
    ).not.toBeInTheDocument();
  });

  it("does not offer registration unless the screen asks for it", () => {
    renderForm(vi.fn());

    expect(
      screen.queryByRole("switch", { name: "Pedir inscripción" }),
    ).toBeNull();
  });

  it("saves a new event without registration by default", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    renderForm(submit, true);

    await user.type(screen.getByPlaceholderText("Agregar título"), "Culto");
    expect(
      screen.getByRole("switch", { name: "Pedir inscripción" }),
    ).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit.mock.calls[0]?.[0]?.registration.enabled).toBe(false);
  });

  it("saves a course asking for registration with just the seats", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    renderForm(submit, true);

    await user.type(
      screen.getByPlaceholderText("Agregar título"),
      "Discipulado",
    );
    await user.click(screen.getByRole("switch", { name: "Pedir inscripción" }));
    await user.type(screen.getByLabelText("Cupos"), "25");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit.mock.calls[0]?.[0]?.registration).toMatchObject({
      enabled: true,
      tickets: [{ name: "General", quantity: "25" }],
    });
  });

  it("does not save a ticket without a name and says why", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    renderForm(submit, true);

    await user.type(screen.getByPlaceholderText("Agregar título"), "Curso");
    await user.click(screen.getByRole("switch", { name: "Pedir inscripción" }));
    await user.click(
      screen.getByRole("button", { name: "Agregar otro tipo de ticket" }),
    );
    await user.clear(
      within(screen.getByRole("group", { name: "Ticket 2" })).getByLabelText(
        "Nombre",
      ),
    );
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("Ticket 2: ingrese el nombre"),
    ).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it("does not offer registration for a repeating event: each date is its own event", async () => {
    const user = userEvent.setup();
    renderForm(vi.fn(), true);

    expect(
      screen.getByRole("switch", { name: "Pedir inscripción" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Se repite" }));
    await user.click(screen.getByRole("option", { name: "Todos los días" }));

    expect(
      screen.queryByRole("switch", { name: "Pedir inscripción" }),
    ).toBeNull();
  });

  it("sends the day an event of several days ends", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    renderForm(submit, false, {
      ...initialValues,
      name: "Congreso",
      endDate: new Date(2026, 9, 25, 17, 9),
    });

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit.mock.calls[0]?.[0].endDate).toEqual(
      new Date(2026, 9, 25, 17, 9),
    );
  });

  it("asks for the day the event ends next to the day it starts", () => {
    renderForm(vi.fn());

    expect(screen.getByRole("group", { name: "Fecha" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Hasta" })).toBeInTheDocument();
  });

  it("offers to repeat an event of one day but not one of several days", () => {
    const { unmount } = renderForm(vi.fn());
    expect(
      screen.getByRole("combobox", { name: "Se repite" }),
    ).toBeInTheDocument();
    unmount();

    renderForm(vi.fn(), false, {
      ...initialValues,
      endDate: new Date(2026, 9, 24, 17, 9),
    });

    expect(
      screen.queryByRole("combobox", { name: "Se repite" }),
    ).not.toBeInTheDocument();
  });

  it("does not save an event that ends before it starts", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    renderForm(submit, false, {
      ...initialValues,
      name: "Congreso",
      // Same day, but the end time is earlier than the start time.
      endTime: new Date(2026, 9, 23, 16, 9),
    });

    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("El evento debe terminar después de empezar"),
    ).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });

  it("cannot be typed into when it is not editable, and has no Guardar", () => {
    renderWith({ editable: false });

    expect(
      screen.getByPlaceholderText("Agregar título").matches(":disabled"),
    ).toBe(true);
    expect(screen.queryByRole("button", { name: "Guardar" })).toBeNull();
  });

  it("shows the kind as a value, not as buttons, when it is locked", () => {
    renderWith({
      initialValues: { ...initialValues, type: 1 },
      lockType: true,
    });

    expect(screen.getByText("Curso")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Curso" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Evento" })).toBeNull();
  });

  it("says what is being created and what each kind is", async () => {
    const user = userEvent.setup();
    renderForm(vi.fn());

    expect(screen.getByText("Nuevo evento")).toBeInTheDocument();
    expect(
      screen.getByText("Evento: una reunión o actividad con fecha y hora."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Curso" }));

    expect(screen.getByText("Nuevo curso")).toBeInTheDocument();
    expect(
      screen.getByText("Curso: enseñanza con varias sesiones y asistencia."),
    ).toBeInTheDocument();
  });

  it("has the two kinds as buttons with no icon, one of them pressed", () => {
    renderForm(vi.fn());

    const event = screen.getByRole("button", { name: "Evento" });
    const course = screen.getByRole("button", { name: "Curso" });
    expect(event).toHaveAttribute("aria-pressed", "true");
    expect(course).toHaveAttribute("aria-pressed", "false");
    expect(event.querySelector("svg")).toBeNull();
    expect(course.querySelector("svg")).toBeNull();
  });

  it("groups the start and the end, each with its day and its hour", () => {
    renderForm(vi.fn());

    expect(screen.getByText("Empieza")).toBeInTheDocument();
    expect(screen.getByText("Termina")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Fecha" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Hasta" })).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Hora de inicio" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Hora de fin" }),
    ).toBeInTheDocument();
  });

  it("offers the address of the sede and fills the place with it", async () => {
    api.address = "Av. Lima 123";
    const user = userEvent.setup();
    const submit = vi.fn();
    renderForm(submit, false, { ...initialValues, name: "Culto" });

    await user.click(
      screen.getByRole("button", {
        name: "Usar la dirección de la sede: Av. Lima 123",
      }),
    );

    expect(screen.getByLabelText("Lugar")).toHaveValue("Av. Lima 123");
    expect(
      screen.queryByRole("button", { name: /Usar la dirección de la sede/ }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(submit).toHaveBeenCalledOnce());
    expect(submit.mock.calls[0]?.[0].address).toBe("Av. Lima 123");
  });

  it("does not offer the address of the sede when there is none or it is read only", () => {
    renderForm(vi.fn());
    expect(
      screen.queryByRole("button", { name: /Usar la dirección de la sede/ }),
    ).not.toBeInTheDocument();
    cleanup();

    api.address = "Av. Lima 123";
    renderWith({ editable: false });
    expect(
      screen.queryByRole("button", { name: /Usar la dirección de la sede/ }),
    ).not.toBeInTheDocument();
  });

  it("shows each speaker as a chip with their initials", () => {
    renderForm(vi.fn(), false, {
      ...initialValues,
      speakers: [{ id: "p1", label: "María García" }],
    });

    expect(screen.getByLabelText("Ponentes")).toBeInTheDocument();
    const chip = screen.getByText("María García").closest(".MuiChip-root");
    expect(chip).toHaveTextContent("MG");
  });

  it("does not name a new event when the kind is locked", () => {
    renderWith({ lockType: true });

    expect(screen.queryByText("Nuevo evento")).not.toBeInTheDocument();
  });

  it("titles the sections of the form", () => {
    renderForm(vi.fn(), true);

    for (const name of [
      "Tipo",
      "Cuándo",
      "Dónde y quién",
      "Descripción",
      "Inscripción",
    ]) {
      expect(screen.getByText(name, { selector: "p" })).toBeInTheDocument();
    }
  });

  describe("as a sub-event", () => {
    const container = {
      title: "Congreso",
      start: new Date(2026, 9, 23, 0, 0),
      end: new Date(2026, 9, 25, 23, 0),
    };

    const renderSubEvent = (
      submit: (values: EventDetailFormData) => void = vi.fn(),
      values: Partial<EventDetailFormData> = {},
    ) =>
      renderWith({
        initialValues: {
          ...initialValues,
          name: "Taller",
          registrationMode: "INHERIT",
          ...values,
        },
        submit,
        showRegistration: true,
        container,
      });

    it("says which event it is part of and does not offer to repeat", () => {
      renderSubEvent();

      expect(screen.getByText("Parte de «Congreso»")).toBeInTheDocument();
      expect(
        screen.queryByRole("combobox", { name: "Se repite" }),
      ).not.toBeInTheDocument();
    });

    it("offers to ask for a place in the event first only when it has its own sign-up", () => {
      const { unmount } = renderSubEvent();
      expect(
        screen.queryByLabelText(/Solo para quienes ya se inscribieron/),
      ).not.toBeInTheDocument();
      unmount();

      renderSubEvent(vi.fn(), { registrationMode: "OWN" });
      expect(
        screen.getByLabelText(
          "Solo para quienes ya se inscribieron a «Congreso»",
        ),
      ).toBeInTheDocument();
    });

    it("says it is entered with the sign-up of the event unless changed", () => {
      renderSubEvent();

      expect(screen.getByText(/la del evento/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/Serie o curso/)).toBeNull();
    });

    it("asks how it is entered and saves the choice", async () => {
      const user = userEvent.setup();
      const submit = vi.fn();
      renderSubEvent(submit);
      expect(screen.getByText(/la del evento/)).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: "Cambiar la inscripción" }),
      );

      await user.click(screen.getByRole("combobox", { name: "Inscripción" }));
      await user.click(await screen.findByRole("option", { name: "Propia" }));
      await user.click(screen.getByRole("button", { name: "Guardar" }));

      await waitFor(() => expect(submit).toHaveBeenCalledOnce());
      expect(submit.mock.calls[0]?.[0].registrationMode).toBe("OWN");
    });

    it("sets up the sign-up only when it has its own", () => {
      const { unmount } = renderSubEvent();
      expect(
        screen.queryByRole("switch", { name: "Pedir inscripción" }),
      ).not.toBeInTheDocument();
      unmount();

      renderSubEvent(vi.fn(), { registrationMode: "OWN" });

      expect(
        screen.getByRole("switch", { name: "Pedir inscripción" }),
      ).toBeInTheDocument();
    });
  });
});
