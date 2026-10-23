import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { afterEach, describe, expect, it } from "vitest";
import { FormContainer, useForm } from "react-hook-form-mui";
import type { EventDetailFormData } from "./EventForm";
import { RecurrenceFields } from "./RecurrenceFields";

afterEach(cleanup);

// 2026-10-23 is a Friday, so the weekday chip "V" (5) is the default.
const FRIDAY = new Date(2026, 9, 23, 18, 0);

type FormSnapshot = { getValues: () => EventDetailFormData } | null;

const renderFields = () => {
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
        isRecurrent: false,
        daysOfWeek: [],
        type: 0,
        speakers: [],
      },
    });
    snapshot.current = formContext;

    return (
      <FormContainer formContext={formContext} onSuccess={() => undefined}>
        <RecurrenceFields />
      </FormContainer>
    );
  };

  render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Harness />
    </LocalizationProvider>,
  );

  return {
    values: () => snapshot.current?.getValues(),
  };
};

describe("RecurrenceFields", () => {
  it("hides the weekday chips until the event repeats", () => {
    renderFields();

    expect(screen.queryByText("Repetir el")).not.toBeInTheDocument();
  });

  it("selects the weekday of the event when it starts repeating", () => {
    const { values } = renderFields();

    fireEvent.click(screen.getByRole("checkbox", { name: "Se repite" }));

    expect(screen.getByText("Repetir el")).toBeInTheDocument();
    expect(values()?.daysOfWeek).toEqual([5]);
  });

  it("adds and removes weekdays with the chips", () => {
    const { values } = renderFields();
    fireEvent.click(screen.getByRole("checkbox", { name: "Se repite" }));

    fireEvent.click(screen.getByText("L"));
    expect(values()?.daysOfWeek).toEqual([5, 1]);

    fireEvent.click(screen.getByText("V"));
    expect(values()?.daysOfWeek).toEqual([1]);
  });

  it("clears the weekdays when the event stops repeating", () => {
    const { values } = renderFields();
    const checkbox = screen.getByRole("checkbox", { name: "Se repite" });

    fireEvent.click(checkbox);
    fireEvent.click(checkbox);

    expect(screen.queryByText("Repetir el")).not.toBeInTheDocument();
    expect(values()?.daysOfWeek).toEqual([]);
  });
});
