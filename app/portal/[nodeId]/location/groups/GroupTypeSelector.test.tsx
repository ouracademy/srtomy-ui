import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { FormContainer } from "react-hook-form-mui";
import { GroupTypeHint, GroupTypeSelector } from "./GroupTypeSelector";

afterEach(cleanup);

const setup = (type: "GROUP" | "MINISTRY" = "GROUP", disabled = false) => {
  render(
    <FormContainer defaultValues={{ type }}>
      <GroupTypeSelector disabled={disabled} />
      <GroupTypeHint />
    </FormContainer>,
  );
  return userEvent.setup();
};

describe("GroupTypeSelector", () => {
  it("offers Grupo and Ministerio, each with its icon", () => {
    setup();

    const group = screen.getByRole("button", { name: "Grupo" });
    const ministry = screen.getByRole("button", { name: "Ministerio" });
    expect(group.querySelector("[data-testid='GroupsIcon']")).not.toBeNull();
    expect(
      ministry.querySelector("[data-testid='FavoriteIcon']"),
    ).not.toBeNull();
  });

  it("marks the chosen type and moves the mark on click", async () => {
    const user = setup("GROUP");
    const group = screen.getByRole("button", { name: "Grupo" });
    const ministry = screen.getByRole("button", { name: "Ministerio" });
    expect(group).toHaveAttribute("aria-pressed", "true");
    expect(ministry).toHaveAttribute("aria-pressed", "false");

    await user.click(ministry);

    expect(ministry).toHaveAttribute("aria-pressed", "true");
    expect(group).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps the type when the chosen button is pressed again", async () => {
    const user = setup("MINISTRY");

    await user.click(screen.getByRole("button", { name: "Ministerio" }));

    expect(screen.getByRole("button", { name: "Ministerio" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("says what the chosen type is, and follows the choice", async () => {
    const user = setup("GROUP");
    expect(
      screen.getByText(/personas que se reúnen con regularidad/),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Ministerio" }));

    expect(screen.getByText(/área de servicio a la iglesia/)).toBeVisible();
    expect(
      screen.queryByText(/personas que se reúnen con regularidad/),
    ).not.toBeInTheDocument();
  });

  it("can be chosen with the keyboard", async () => {
    const user = setup("GROUP");

    // Only the chosen button is a tab stop; the arrows move to the other.
    await user.tab();
    await user.keyboard("{ArrowRight}{Enter}");

    expect(screen.getByRole("button", { name: "Ministerio" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("cannot be changed when it is read only", () => {
    setup("GROUP", true);

    expect(screen.getByRole("button", { name: "Grupo" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ministerio" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Grupo" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
