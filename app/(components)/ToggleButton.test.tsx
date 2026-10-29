import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToggleButton } from "./ToggleButton";

afterEach(cleanup);

describe("ToggleButton", () => {
  it("reports 0 when the event button is clicked", () => {
    const onChange = vi.fn();
    render(<ToggleButton eventType={1} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Evento" }));

    expect(onChange).toHaveBeenCalledWith(0);
  });

  it("reports 1 when the course button is clicked", () => {
    const onChange = vi.fn();
    render(<ToggleButton eventType={0} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Curso" }));

    expect(onChange).toHaveBeenCalledWith(1);
  });

  it("fills the button of the selected type", () => {
    const { rerender } = render(
      <ToggleButton eventType={0} onChange={() => undefined} />,
    );

    expect(screen.getByRole("button", { name: "Evento" })).toHaveStyle({
      backgroundColor: "rgb(59, 130, 246)",
    });
    expect(screen.getByRole("button", { name: "Curso" })).not.toHaveStyle({
      backgroundColor: "rgb(59, 130, 246)",
    });

    rerender(<ToggleButton eventType={1} onChange={() => undefined} />);

    expect(screen.getByRole("button", { name: "Curso" })).toHaveStyle({
      backgroundColor: "rgb(59, 130, 246)",
    });
    expect(screen.getByRole("button", { name: "Evento" })).not.toHaveStyle({
      backgroundColor: "rgb(59, 130, 246)",
    });
  });
});

describe("ToggleButton when the kind cannot change", () => {
  it("disables both buttons", () => {
    const onChange = vi.fn();
    render(<ToggleButton eventType={0} onChange={onChange} disabled />);

    expect(
      (screen.getByRole("button", { name: "Evento" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "Curso" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });
});
