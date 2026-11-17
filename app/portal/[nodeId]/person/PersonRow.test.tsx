import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PersonRow } from "./PersonRow";

afterEach(cleanup);

const renderRow = (
  person = { id: "p1", fullName: "Ana Diaz", memberState: "MEMBER" } as const,
  onDelete = vi.fn(),
) => {
  render(
    <ul>
      <PersonRow
        person={person}
        nodeId="n1"
        canDelete={true}
        onDelete={onDelete}
      />
    </ul>,
  );
  return { onDelete, user: userEvent.setup() };
};

describe("PersonRow", () => {
  it("shows the name and the state, and links to the person", () => {
    renderRow();

    const link = screen.getByRole("link", { name: /Ana Diaz/ });
    expect(link).toHaveAttribute("href", "/portal/n1/person/p1");
    expect(link).toHaveTextContent("Miembro");
  });

  it("names a person that has no name", () => {
    renderRow({ id: "p2" } as never);

    expect(screen.getByText("Sin nombre")).toBeVisible();
  });

  it("hands the person to delete over after choosing Eliminar", async () => {
    const { onDelete, user } = renderRow();

    await user.click(
      screen.getByRole("button", { name: "Acciones para Ana Diaz" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Eliminar" }));

    expect(onDelete).toHaveBeenCalledWith({ id: "p1", name: "Ana Diaz" });
  });
});
