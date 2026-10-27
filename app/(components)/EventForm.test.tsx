import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventForm, EventDetailFormData } from "./EventForm";
import { noRecurrence } from "./recurrence";

vi.mock("@/app/(api)/generated", () => ({
  useGetOrganizationsById: () => ({ data: undefined }),
  useGetPeople: () => ({ data: undefined }),
}));

afterEach(cleanup);

const initialValues: EventDetailFormData = {
  name: "",
  date: new Date(2026, 9, 23, 17, 9),
  startTime: new Date(2026, 9, 23, 17, 9),
  endTime: new Date(2026, 9, 23, 18, 9),
  address: "",
  description: "",
  recurrence: noRecurrence(),
  type: 0,
  speakers: [],
};

const renderForm = (submit: (values: EventDetailFormData) => void) =>
  render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <EventForm
        nodeId="11111111-1111-1111-1111-111111111111"
        initialValues={initialValues}
        submit={submit}
        editable
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
    await user.click(screen.getByRole("option", { name: "Semanalmente" }));
    // The weekday of the event is selected; clear it.
    await user.click(screen.getByText("V"));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

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
});
