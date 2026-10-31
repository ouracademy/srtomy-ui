import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventForm, EventDetailFormData } from "./EventForm";
import { noRecurrence } from "./recurrence";
import { noRegistration } from "./registration";

vi.mock("@/app/(api)/generated", () => ({
  useGetOrganizationsById: () => ({ data: undefined }),
  useGetPeople: () => ({ data: undefined }),
}));

afterEach(cleanup);

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

const renderForm = (
  submit: (values: EventDetailFormData) => void,
  showRegistration = false,
  values: EventDetailFormData = initialValues,
) =>
  render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <EventForm
        nodeId="11111111-1111-1111-1111-111111111111"
        initialValues={values}
        submit={submit}
        editable
        showRegistration={showRegistration}
      />
    </LocalizationProvider>,
  );

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
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <EventForm
          nodeId="11111111-1111-1111-1111-111111111111"
          initialValues={{
            ...initialValues,
            recurrence: { ...noRecurrence(), frequency: "DAILY" },
          }}
          submit={vi.fn()}
          editable={false}
        />
      </LocalizationProvider>,
    );

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
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <EventForm
          nodeId="11111111-1111-1111-1111-111111111111"
          initialValues={initialValues}
          submit={vi.fn()}
          editable={false}
        />
      </LocalizationProvider>,
    );

    expect(
      screen.getByPlaceholderText("Agregar título").matches(":disabled"),
    ).toBe(true);
    expect(screen.queryByRole("button", { name: "Guardar" })).toBeNull();
  });

  it("shows the kind as a value, not as buttons, when it is locked", () => {
    render(
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <EventForm
          nodeId="11111111-1111-1111-1111-111111111111"
          initialValues={{ ...initialValues, type: 1 }}
          submit={vi.fn()}
          editable
          lockType
        />
      </LocalizationProvider>,
    );

    expect(screen.getByText("Curso")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Curso" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Evento" })).toBeNull();
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
      render(
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <EventForm
            nodeId="11111111-1111-1111-1111-111111111111"
            initialValues={{
              ...initialValues,
              name: "Taller",
              registrationMode: "INHERIT",
              ...values,
            }}
            submit={submit}
            editable
            showRegistration
            container={container}
          />
        </LocalizationProvider>,
      );

    it("says which event it is part of and does not offer to repeat", () => {
      renderSubEvent();

      expect(screen.getByText("Parte de «Congreso»")).toBeInTheDocument();
      expect(
        screen.queryByRole("combobox", { name: "Se repite" }),
      ).not.toBeInTheDocument();
    });

    it("asks how it is entered and saves the choice", async () => {
      const user = userEvent.setup();
      const submit = vi.fn();
      renderSubEvent(submit);
      expect(
        screen.getByText(
          "Quien se inscribe al evento puede entrar a este sub-evento.",
        ),
      ).toBeInTheDocument();

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
