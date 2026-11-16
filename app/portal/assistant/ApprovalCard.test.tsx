import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApprovalCard, type ApprovalPart } from "./ApprovalCard";

const create: ApprovalPart = {
  toolName: "post_events",
  input: {
    body: { name: "Ensayo de alabanza", startTime: "2026-11-20T19:00" },
  },
  approval: {
    id: "ap-1",
    requestReason: "Crear evento: Ensayo de alabanza, viernes 20 de noviembre",
  },
};

describe("ApprovalCard", () => {
  afterEach(cleanup);

  it("shows the server's sentence and the main data", () => {
    render(<ApprovalCard part={create} onRespond={vi.fn()} />);

    expect(
      screen.getByRole("group", { name: "Confirmar acción" }),
    ).toHaveTextContent(
      "Crear evento: Ensayo de alabanza, viernes 20 de noviembre",
    );
    expect(screen.getByText("Nombre:")).toBeInTheDocument();
    expect(screen.getByText("Ensayo de alabanza")).toBeInTheDocument();
    expect(screen.queryByText(/No se puede deshacer/)).not.toBeInTheDocument();
  });

  it("confirms", async () => {
    const user = userEvent.setup();
    const onRespond = vi.fn();
    render(<ApprovalCard part={create} onRespond={onRespond} />);

    await user.click(screen.getByRole("button", { name: "Confirmar" }));

    expect(onRespond).toHaveBeenCalledWith("ap-1", true);
  });

  it("cancels", async () => {
    const user = userEvent.setup();
    const onRespond = vi.fn();
    render(<ApprovalCard part={create} onRespond={onRespond} />);

    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onRespond).toHaveBeenCalledWith("ap-1", false);
  });

  it("marks a deletion as dangerous and irreversible", () => {
    render(
      <ApprovalCard
        part={{
          toolName: "delete_people_id",
          input: { id: "p-1" },
          approval: { id: "ap-2", requestReason: "Eliminar a Ana Díaz" },
        }}
        onRespond={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("group", { name: "Confirmar eliminación" }),
    ).toHaveTextContent("No se puede deshacer.");
  });

  it("locks both buttons once answered and keeps the chosen one busy", async () => {
    const user = userEvent.setup();
    const onRespond = vi.fn();
    render(
      <ApprovalCard
        part={{ ...create, approval: { ...create.approval, approved: true } }}
        onRespond={onRespond}
      />,
    );

    const confirm = screen.getByRole("button", { name: "Confirmar" });
    expect(confirm).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    expect(confirm.querySelector('[role="progressbar"]')).not.toBeNull();
    await expect(user.click(confirm)).rejects.toThrow(/pointer-events/);
    expect(onRespond).not.toHaveBeenCalled();
  });
});
