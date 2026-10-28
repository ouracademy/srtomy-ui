import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CustomRecurrenceDialog } from "./CustomRecurrenceDialog";
import { noRecurrence, type RecurrenceFormData } from "./recurrence";

afterEach(cleanup);

// 2026-10-23 is the fourth Friday of October.
const FRIDAY = new Date(2026, 9, 23, 18, 0);

const renderDialog = (value: RecurrenceFormData = noRecurrence()) => {
  const onSave = vi.fn();
  const onCancel = vi.fn();
  render(
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <CustomRecurrenceDialog
        value={value}
        date={FRIDAY}
        onSave={onSave}
        onCancel={onCancel}
      />
    </LocalizationProvider>,
  );
  return { user: userEvent.setup(), onSave, onCancel };
};

const choose = async (
  user: ReturnType<typeof userEvent.setup>,
  field: string,
  option: string,
) => {
  await user.click(screen.getByRole("combobox", { name: field }));
  await user.click(screen.getByRole("option", { name: option }));
};

describe("CustomRecurrenceDialog", () => {
  it("starts weekly on the weekday of the event when it did not repeat", async () => {
    const { user, onSave } = renderDialog();

    expect(screen.getByRole("combobox", { name: "Unidad" })).toHaveTextContent(
      "semana",
    );
    await user.click(screen.getByRole("button", { name: "Listo" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: "WEEKLY",
        interval: 1,
        daysOfWeek: [5],
        endType: "NEVER",
      }),
    );
  });

  it("adds and removes weekdays with the chips", async () => {
    const { user, onSave } = renderDialog();

    await user.click(screen.getByText("L"));
    await user.click(screen.getByText("V"));
    await user.click(screen.getByRole("button", { name: "Listo" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ daysOfWeek: [1] }),
    );
  });

  it("requires at least one weekday", async () => {
    const { user, onSave } = renderDialog();

    await user.click(screen.getByText("V"));
    await user.click(screen.getByRole("button", { name: "Listo" }));

    expect(
      screen.getByText("Elige al menos un día de la semana"),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("changes the interval and keeps it between 1 and 99", async () => {
    const { user, onSave } = renderDialog();
    const every = screen.getByLabelText("Repetir cada");

    await user.clear(every);
    await user.type(every, "2");
    expect(screen.getByRole("combobox", { name: "Unidad" })).toHaveTextContent(
      "semanas",
    );
    await user.clear(every);
    await user.type(every, "500");
    await user.click(screen.getByRole("button", { name: "Listo" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ interval: 99 }),
    );
  });

  it("offers the day of the month or the nth weekday when it repeats monthly", async () => {
    const { user, onSave } = renderDialog();
    await choose(user, "Unidad", "mes");

    await user.click(screen.getByRole("combobox", { name: "Se repite el" }));
    expect(
      screen.getByRole("option", { name: "Día 23 del mes" }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("option", { name: "El cuarto viernes del mes" }),
    );
    await user.click(screen.getByRole("button", { name: "Listo" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: "MONTHLY",
        monthlyMode: "NTH_WEEKDAY",
      }),
    );
  });

  it("can repeat yearly", async () => {
    const { user, onSave } = renderDialog();
    await choose(user, "Unidad", "año");
    await user.click(screen.getByRole("button", { name: "Listo" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: "YEARLY" }),
    );
  });

  it("ends after a number of times", async () => {
    const { user, onSave } = renderDialog();

    await user.click(screen.getByRole("radio", { name: "Después de" }));
    const times = screen.getByLabelText("Repeticiones");
    await user.clear(times);
    await user.type(times, "5");
    await user.click(screen.getByRole("button", { name: "Listo" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ endType: "COUNT", count: 5 }),
    );
  });

  it("requires the end date when it ends on a date", async () => {
    const { user, onSave } = renderDialog();

    await user.click(screen.getByRole("radio", { name: "Nunca" }));
    await user.click(screen.getByRole("radio", { name: "El" }));
    await user.click(screen.getByRole("button", { name: "Listo" }));

    expect(
      screen.getByText("Elige la fecha en la que termina"),
    ).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("edits the current custom rule", async () => {
    const { user, onSave } = renderDialog({
      ...noRecurrence(),
      frequency: "DAILY",
      interval: 3,
    });

    expect(screen.getByLabelText("Repetir cada")).toHaveValue(3);
    expect(screen.getByRole("combobox", { name: "Unidad" })).toHaveTextContent(
      "días",
    );
    await user.click(screen.getByRole("button", { name: "Listo" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ frequency: "DAILY", interval: 3 }),
    );
  });

  it("cancels without saving", async () => {
    const { user, onSave, onCancel } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSave).not.toHaveBeenCalled();
  });
});
