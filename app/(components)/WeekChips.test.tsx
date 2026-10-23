import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WeekChips } from "./WeekChips";

afterEach(cleanup);

describe("WeekChips", () => {
  it("adds a day when it is not selected", () => {
    const onChange = vi.fn();
    render(<WeekChips chipsValue={[1]} onChange={onChange} />);

    fireEvent.click(screen.getByText("M"));

    expect(onChange).toHaveBeenCalledWith([1, 2]);
  });

  it("removes a day when it is already selected", () => {
    const onChange = vi.fn();
    render(<WeekChips chipsValue={[1, 2]} onChange={onChange} />);

    fireEvent.click(screen.getByText("L"));

    expect(onChange).toHaveBeenCalledWith([2]);
  });

  it("highlights only the selected days", () => {
    render(<WeekChips chipsValue={[3, 0]} onChange={() => undefined} />);

    expect(screen.getByRole("button", { name: "Mi" })).toHaveClass(
      "MuiChip-colorPrimary",
    );
    expect(screen.getByRole("button", { name: "D" })).toHaveClass(
      "MuiChip-colorPrimary",
    );
    expect(screen.getByRole("button", { name: "L" })).not.toHaveClass(
      "MuiChip-colorPrimary",
    );
  });

  it.each([
    ["L", 1],
    ["M", 2],
    ["Mi", 3],
    ["J", 4],
    ["V", 5],
    ["S", 6],
    ["D", 0],
  ])("toggles %s as weekday %i", (label, weekDay) => {
    const onChange = vi.fn();
    render(<WeekChips chipsValue={[]} onChange={onChange} />);

    fireEvent.click(screen.getByText(label));

    expect(onChange).toHaveBeenCalledWith([weekDay]);
  });
});
