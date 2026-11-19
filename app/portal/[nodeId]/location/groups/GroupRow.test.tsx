import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GroupRow } from "./GroupRow";

afterEach(cleanup);

const renderRow = (group: object, canDelete = true) => {
  const onDelete = vi.fn();
  render(
    <ul>
      <GroupRow group={group} canDelete={canDelete} onDelete={onDelete} />
    </ul>,
  );
  return { onDelete, user: userEvent.setup() };
};

describe("GroupRow", () => {
  it("shows the name, the type and the schedule, and links to it", () => {
    renderRow({
      id: "g1",
      name: "Alabanza",
      type: "MINISTRY",
      schedule: "Domingos 8 am",
    });

    const link = screen.getByRole("link", { name: /Alabanza/ });
    expect(link).toHaveAttribute("href", "/portal/g1/location");
    expect(link).toHaveTextContent("Ministerio");
    expect(link).toHaveTextContent("Domingos 8 am");
  });

  it("names one that has no name", () => {
    renderRow({ id: "g2", type: "GROUP" });

    expect(screen.getByText("Sin nombre")).toBeVisible();
  });

  it("hands the group to delete over after choosing Eliminar", async () => {
    const { onDelete, user } = renderRow({
      id: "g1",
      name: "Alabanza",
      type: "MINISTRY",
    });

    await user.click(
      screen.getByRole("button", { name: "Acciones para Alabanza" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Eliminar" }));

    expect(onDelete).toHaveBeenCalledWith({ id: "g1", name: "Alabanza" });
  });
});
