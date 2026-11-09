import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateRangeSelector } from "./DateRangeSelector";
import { selectionForPreset } from "./dateRange";

const NOW = new Date(2026, 9, 30); // Fri 30 Oct 2026

const renderSelector = (value = selectionForPreset("last-week", NOW)) => {
  const onChange = vi.fn();
  render(
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <DateRangeSelector value={value} onChange={onChange} />
    </LocalizationProvider>,
  );
  return { user: userEvent.setup(), onChange };
};

afterEach(() => {
  cleanup();
});

describe("DateRangeSelector", () => {
  it("shows every preset and the current one selected", () => {
    renderSelector();
    expect(
      screen.getByRole("button", { name: "Última semana", pressed: true }),
    ).toBeTruthy();
    for (const label of [
      "Último mes",
      "Último trimestre",
      "Último año",
      "Personalizado",
    ]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });

  it.each([
    ["Último mes", "last-month"],
    ["Último trimestre", "last-quarter"],
    ["Último año", "last-year"],
  ])("selects the %s preset", async (label, preset) => {
    const { user, onChange } = renderSelector();

    await user.click(screen.getByRole("button", { name: label }));

    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ preset }));
  });

  it("opens a popover with two date pickers for a custom range", async () => {
    const { user } = renderSelector();

    await user.click(screen.getByRole("button", { name: "Personalizado" }));

    expect(screen.getByRole("group", { name: "Desde" })).toBeTruthy();
    expect(screen.getByRole("group", { name: "Hasta" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Aplicar" })).toBeTruthy();
  });

  it("applies a custom range picked with the date pickers", async () => {
    const { user, onChange } = renderSelector();

    await user.click(screen.getByRole("button", { name: "Personalizado" }));

    const startField = screen.getByRole("group", { name: "Desde" });
    await user.click(within(startField).getByRole("button"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("gridcell", { name: "1" }),
    );

    const endField = screen.getByRole("group", { name: "Hasta" });
    await user.click(within(endField).getByRole("button"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("gridcell", {
        name: "20",
      }),
    );

    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ preset: "custom" }),
    );
  });

  it("rejects a custom range where the start is after the end", async () => {
    const { user, onChange } = renderSelector();

    await user.click(screen.getByRole("button", { name: "Personalizado" }));

    const startField = screen.getByRole("group", { name: "Desde" });
    await user.click(within(startField).getByRole("button"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("gridcell", {
        name: "20",
      }),
    );

    const endField = screen.getByRole("group", { name: "Hasta" });
    await user.click(within(endField).getByRole("button"));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("gridcell", { name: "1" }),
    );

    expect(
      screen.getByText(
        "La fecha de inicio debe ser anterior a la fecha de fin.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Aplicar" })).toBeDisabled();
    expect(onChange).not.toHaveBeenCalled();
  });
});
