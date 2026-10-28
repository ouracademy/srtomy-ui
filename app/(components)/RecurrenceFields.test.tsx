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
  it("offers not repeating, every day, every week and custom", async () => {
    const { user } = renderFields();

    expect(
      screen.getByRole("combobox", { name: "Se repite" }),
    ).toHaveTextContent("No se repite");
    await user.click(screen.getByRole("combobox", { name: "Se repite" }));

    expect(
      screen.getAllByRole("option").map((option) => option.textContent),
    ).toEqual([
      "No se repite",
      "Todos los días",
      "Todas las semanas",
      "Personalizar…",
    ]);
  });

  it("repeats daily", async () => {
    const { user, recurrence } = renderFields();

    await choose(user, "Se repite", "Todos los días");

    expect(recurrence()).toMatchObject({
      frequency: "DAILY",
      interval: 1,
      endType: "NEVER",
    });
    expect(
      screen.getByRole("combobox", { name: "Se repite" }),
    ).toHaveTextContent("Todos los días");
  });

  it("repeats weekly on the weekday of the event", async () => {
    const { user, recurrence } = renderFields();

    await choose(user, "Se repite", "Todas las semanas");

    expect(recurrence()).toMatchObject({
      frequency: "WEEKLY",
      daysOfWeek: [5],
    });
    expect(
      screen.getByRole("combobox", { name: "Se repite" }),
    ).toHaveTextContent("Todas las semanas");
  });

  it("stops repeating when it goes back to not repeating", async () => {
    const { user, recurrence } = renderFields();
    await choose(user, "Se repite", "Todos los días");

    await choose(user, "Se repite", "No se repite");

    expect(recurrence()?.frequency).toBe("NONE");
  });

  it("saves a custom rule from the dialog and shows it as the choice", async () => {
    const { user, recurrence } = renderFields();

    await choose(user, "Se repite", "Personalizar…");
    const every = screen.getByLabelText("Repetir cada");
    await user.clear(every);
    await user.type(every, "2");
    await user.click(screen.getByRole("radio", { name: "Después de" }));
    const times = screen.getByLabelText("Repeticiones");
    await user.clear(times);
    await user.type(times, "5");
    await user.click(screen.getByRole("button", { name: "Listo" }));

    expect(recurrence()).toMatchObject({
      frequency: "WEEKLY",
      interval: 2,
      endType: "COUNT",
      count: 5,
    });
    expect(
      screen.queryByRole("dialog", { name: "Recurrencia personalizada" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Se repite" }),
    ).toHaveTextContent("Cada 2 semanas el viernes, 5 veces");
  });

  it("keeps the previous rule when the dialog is cancelled", async () => {
    const { user, recurrence } = renderFields();
    await choose(user, "Se repite", "Todos los días");

    await choose(user, "Se repite", "Personalizar…");
    await user.click(screen.getByRole("radio", { name: "Después de" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(recurrence()).toMatchObject({
      frequency: "DAILY",
      endType: "NEVER",
    });
    expect(
      screen.getByRole("combobox", { name: "Se repite" }),
    ).toHaveTextContent("Todos los días");
  });

  it("only describes the repetition when it is read only", () => {
    renderFields(true);

    expect(screen.getByLabelText("Repetición")).toHaveTextContent(
      "No se repite",
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
