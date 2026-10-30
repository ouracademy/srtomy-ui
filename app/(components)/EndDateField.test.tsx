import { act, cleanup, render, screen } from "@testing-library/react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { afterEach, describe, expect, it } from "vitest";
import { FormContainer, useForm } from "react-hook-form-mui";
import { EndDateField } from "./EndDateField";
import type { EventDetailFormData } from "./EventForm";
import { noRecurrence } from "./recurrence";

afterEach(cleanup);

const FRIDAY = new Date(2026, 9, 23, 18, 0);

type Form = ReturnType<typeof useForm<EventDetailFormData>>;

const renderField = (endDate: Date, frequency: "NONE" | "DAILY" = "NONE") => {
  const snapshot: { current: Form | null } = { current: null };

  const Harness = () => {
    const formContext = useForm<EventDetailFormData>({
      defaultValues: {
        name: "",
        date: FRIDAY,
        endDate,
        startTime: FRIDAY,
        endTime: FRIDAY,
        recurrence: { ...noRecurrence(), frequency },
        type: 0,
        speakers: [],
      },
    });
    snapshot.current = formContext;
    return (
      <FormContainer formContext={formContext} onSuccess={() => undefined}>
        <EndDateField />
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
    // What the user does when they choose another day in "Fecha".
    chooseDate: (date: Date) =>
      act(() => snapshot.current?.setValue("date", date)),
  };
};

describe("EndDateField", () => {
  it("shows the end date next to the start", () => {
    renderField(FRIDAY);

    expect(screen.getByRole("group", { name: "Hasta" })).toBeInTheDocument();
  });

  it("moves the end with the start while the event is of one day", async () => {
    const { values, chooseDate } = renderField(FRIDAY);

    await chooseDate(new Date(2026, 9, 28, 18, 0));

    expect(values()?.endDate).toEqual(new Date(2026, 9, 28, 18, 0));
  });

  it("keeps the end of an event of several days when the start moves", async () => {
    const end = new Date(2026, 9, 30, 13, 0);
    const { values, chooseDate } = renderField(end);

    await chooseDate(new Date(2026, 9, 27, 18, 0));

    expect(values()?.endDate).toEqual(end);
  });

  it("never lets the end fall before the start", async () => {
    const { values, chooseDate } = renderField(new Date(2026, 9, 25));

    await chooseDate(new Date(2026, 9, 28, 18, 0));

    expect(values()?.endDate).toEqual(new Date(2026, 9, 28, 18, 0));
  });

  it("does not let an event that lasts days also repeat", () => {
    const { values } = renderField(new Date(2026, 9, 25), "DAILY");

    expect(values()?.recurrence.frequency).toBe("NONE");
  });

  it("lets an event of one day repeat", () => {
    const { values } = renderField(FRIDAY, "DAILY");

    expect(values()?.recurrence.frequency).toBe("DAILY");
  });
});
