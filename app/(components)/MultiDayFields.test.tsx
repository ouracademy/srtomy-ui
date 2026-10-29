import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { afterEach, describe, expect, it } from "vitest";
import { FormContainer, useForm } from "react-hook-form-mui";
import type { EventDetailFormData } from "./EventForm";
import { MultiDayFields } from "./MultiDayFields";
import { noRecurrence } from "./recurrence";

afterEach(cleanup);

const FRIDAY = new Date(2026, 9, 23, 18, 0);

const renderFields = (endDate: Date | null = null) => {
  const snapshot: { current: { getValues: () => EventDetailFormData } | null } =
    { current: null };

  const Harness = () => {
    const formContext = useForm<EventDetailFormData>({
      defaultValues: {
        name: "",
        date: FRIDAY,
        endDate,
        startTime: FRIDAY,
        endTime: FRIDAY,
        recurrence: { ...noRecurrence(), frequency: "DAILY" },
        type: 0,
        speakers: [],
      },
    });
    snapshot.current = formContext;
    return (
      <FormContainer formContext={formContext} onSuccess={() => undefined}>
        <MultiDayFields />
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
    values: () => snapshot.current?.getValues(),
  };
};

describe("MultiDayFields", () => {
  it("asks only for the end date once the event lasts several days", async () => {
    const { user, values } = renderFields();
    expect(
      screen.queryByRole("group", { name: "Hasta" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("switch", { name: "Dura varios días" }));

    expect(
      await screen.findByRole("group", { name: "Hasta" }),
    ).toBeInTheDocument();
    expect(values()?.endDate).toEqual(new Date(2026, 9, 24, 18, 0));
  });

  it("does not let an event that lasts days also repeat", async () => {
    const { user, values } = renderFields();

    await user.click(screen.getByRole("switch", { name: "Dura varios días" }));

    expect(values()?.recurrence.frequency).toBe("NONE");
  });

  it("goes back to a single day when switched off", async () => {
    const { user, values } = renderFields(new Date(2026, 9, 25));
    const toggle = screen.getByRole("switch", { name: "Dura varios días" });
    expect(toggle).toBeChecked();

    await user.click(toggle);

    expect(values()?.endDate).toBeNull();
    expect(
      screen.queryByRole("group", { name: "Hasta" }),
    ).not.toBeInTheDocument();
  });
});
