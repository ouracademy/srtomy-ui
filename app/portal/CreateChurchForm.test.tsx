import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CreateChurchForm } from "./CreateChurchForm";

vi.mock("@/app/(api)/generated", () => ({
  useGetPositionsSuggestions: () => ({ data: ["Pastor", "Diácono"] }),
}));

afterEach(cleanup);

describe("CreateChurchForm", () => {
  it("sends the church, its first location and the edited positions", async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<CreateChurchForm submit={submit} />);

    await user.type(
      screen.getByRole("textbox", { name: /nombre de la iglesia/i }),
      "Iglesia Vida",
    );
    const location = screen.getByRole("textbox", {
      name: /nombre de la sede/i,
    });
    await user.clear(location);
    await user.type(location, "Sede Centro");
    await user.click(
      screen.getByRole("button", { name: "Maestro" }).querySelector("svg")!,
    );
    await user.type(
      screen.getByRole("combobox", { name: /cargos/i }),
      "Ujier{Enter}",
    );
    await user.click(screen.getByRole("button", { name: "Crear iglesia" }));

    expect(submit).toHaveBeenCalledTimes(1);
    const values = submit.mock.calls[0]?.[0];
    expect(values.name).toBe("Iglesia Vida");
    expect(values.location.name).toBe("Sede Centro");
    expect(values.positions).toEqual([
      "Pastor",
      "Líder de alabanza",
      "Servidor",
      "Ujier",
    ]);
  });

  it("does not submit without a church name", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    render(<CreateChurchForm submit={submit} />);

    await user.click(screen.getByRole("button", { name: "Crear iglesia" }));

    expect(
      await screen.findByText("Ingrese el nombre de la iglesia"),
    ).toBeInTheDocument();
    expect(submit).not.toHaveBeenCalled();
  });
});
