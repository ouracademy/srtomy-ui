import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { afterEach, describe, expect, it } from "vitest";
import { FormContainer, useForm } from "react-hook-form-mui";
import type { EventDetailFormData } from "./EventForm";
import { RecurrenceFields } from "./RecurrenceFields";
import { noRecurrence } from "./recurrence";

afterEach(cleanup);

// 2026-10-23 is the fourth Friday of October, so the weekday chip "V" (5) is
// the default.
const FRIDAY = new Date(2026, 9, 23, 18, 0);

type FormSnapshot = { getValues: () => EventDetailFormData } | null;

const renderFields = (readOnly = false) => {
  const snapshot: { current: FormSnapshot } = { current: null };

  const Harness = () => {
    const formContext = useForm<EventDetailFormData>({
      defaultValues: {
        name: "",
        date: FRIDAY,
        startTime: FRIDAY,
        endTime: FRIDAY,
        address: "",
        description: "",
        recurrence: noRecurrence(),
        type: 0,
        speakers: [],
      },
    });
    snapshot.current = formContext;

    return (
      <FormContainer formContext={formContext} onSuccess={() => undefined}>
        <RecurrenceFields readOnly={readOnly} />
      </FormContainer>
    );
  };

  render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Harness />
    </LocalizationProvider>,
  );

  return {
    user: userEvent.setup(),
    recurrence: () => snapshot.current?.getValues().recurrence,
  };
};

const choose = async (
  user: ReturnType<typeof userEvent.setup>,
  field: string,
  option: string,
) => {
  await user.click(screen.getByRole("combobox", { name: field }));
  await user.click(screen.getByRole("option", { name: option }));
};

describe("RecurrenceFields", () => {
  it("shows only the frequency until the event repeats", () => {
    renderFields();

    expect(
      screen.getByRole("combobox", { name: "Se repite" }),
    ).toHaveTextContent("No se repite");
    expect(screen.queryByLabelText("Cada")).not.toBeInTheDocument();
    expect(screen.queryByText("Termina")).not.toBeInTheDocument();
  });

  it("repeats daily and says so", async () => {
    const { user, recurrence } = renderFields();

    await choose(user, "Se repite", "Todos los días");

    expect(recurrence()?.frequency).toBe("DAILY");
    expect(screen.getByText("día")).toBeInTheDocument();
    expect(
      screen.getByText("Todos los días", { selector: "p" }),
    ).toBeInTheDocument();
  });

  it("selects the weekday of the event when it starts repeating weekly", async () => {
    const { user, recurrence } = renderFields();

    await choose(user, "Se repite", "Semanalmente");

    expect(screen.getByText("Repetir el")).toBeInTheDocument();
    expect(recurrence()?.daysOfWeek).toEqual([5]);
  });

  it("adds and removes weekdays with the chips", async () => {
    const { user, recurrence } = renderFields();
    await choose(user, "Se repite", "Semanalmente");

    await user.click(screen.getByText("L"));
    expect(recurrence()?.daysOfWeek).toEqual([5, 1]);

    await user.click(screen.getByText("V"));
    expect(recurrence()?.daysOfWeek).toEqual([1]);
  });

  it("changes the interval and keeps it between 1 and 99", async () => {
    const { user, recurrence } = renderFields();
    await choose(user, "Se repite", "Semanalmente");
    const every = screen.getByLabelText("Cada");

    await user.clear(every);
    await user.type(every, "2");
    expect(recurrence()?.interval).toBe(2);
    expect(screen.getByText("semanas")).toBeInTheDocument();

    await user.clear(every);
    await user.type(every, "500");
    expect(recurrence()?.interval).toBe(99);
  });

  it("offers the day of the month or the nth weekday when it repeats monthly", async () => {
    const { user, recurrence } = renderFields();
    await choose(user, "Se repite", "Mensualmente");

    await user.click(screen.getByRole("combobox", { name: "Se repite el" }));
    expect(
      screen.getByRole("option", { name: "Día 23 del mes" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("option", { name: "El cuarto viernes del mes" }),
    );

    expect(recurrence()?.monthlyMode).toBe("NTH_WEEKDAY");
  });

  it("ends after a number of times", async () => {
    const { user, recurrence } = renderFields();
    await choose(user, "Se repite", "Todos los días");

    await user.click(screen.getByRole("radio", { name: "Después de" }));
    const times = screen.getByLabelText("Repeticiones");
    await user.clear(times);
    await user.type(times, "5");

    expect(recurrence()).toMatchObject({ endType: "COUNT", count: 5 });
    expect(screen.getByText("Todos los días, 5 veces")).toBeInTheDocument();
  });

  it("never ends by default and can end on a date", async () => {
    const { user, recurrence } = renderFields();
    await choose(user, "Se repite", "Todos los días");
    expect(screen.getByRole("radio", { name: "Nunca" })).toBeChecked();

    const endDate = () => screen.getAllByLabelText("Fecha de fin");
    const isDisabled = (element: HTMLElement) =>
      element.hasAttribute("disabled") ||
      element.getAttribute("aria-disabled") === "true";
    expect(endDate().some(isDisabled)).toBe(true);

    await user.click(screen.getByRole("radio", { name: "El" }));

    expect(recurrence()?.endType).toBe("UNTIL");
    expect(endDate().some(isDisabled)).toBe(false);
  });

  it("stops repeating when it goes back to not repeating", async () => {
    const { user, recurrence } = renderFields();
    await choose(user, "Se repite", "Todos los días");

    await choose(user, "Se repite", "No se repite");

    expect(recurrence()?.frequency).toBe("NONE");
    expect(screen.queryByText("Termina")).not.toBeInTheDocument();
  });

  it("only describes the repetition when it is read only", () => {
    renderFields(true);

    expect(screen.getByLabelText("Repetición")).toHaveTextContent(
      "No se repite",
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
