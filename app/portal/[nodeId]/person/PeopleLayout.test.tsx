import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PeopleLayout } from "./PeopleLayout";

const replace = vi.fn();
let search = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => "/portal/n1/person",
  // a new object on every render, like Next does after each navigation
  useSearchParams: () => new URLSearchParams(search),
}));

describe("PeopleLayout", () => {
  afterEach(cleanup);

  beforeEach(() => {
    replace.mockClear();
    search = "";
  });

  it("does not navigate on mount nor on re-renders", () => {
    const { rerender } = render(
      <PeopleLayout nodeId="n1">
        <p>x</p>
      </PeopleLayout>,
    );
    rerender(
      <PeopleLayout nodeId="n1">
        <p>x</p>
      </PeopleLayout>,
    );
    expect(replace).not.toHaveBeenCalled();
  });

  it("puts the typed search in the url once", async () => {
    const user = userEvent.setup();
    render(
      <PeopleLayout nodeId="n1">
        <p>x</p>
      </PeopleLayout>,
    );
    await user.type(screen.getByPlaceholderText("Buscar"), "ana");
    await vi.waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/portal/n1/person?search=ana"),
    );
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("offers to add a person", () => {
    render(
      <PeopleLayout nodeId="n1">
        <p>x</p>
      </PeopleLayout>,
    );

    expect(
      screen.getByRole("link", { name: "Agregar persona" }),
    ).toHaveAttribute("href", "/portal/n1/person/create");
  });

  it("filters by state through the url and keeps the search", async () => {
    const user = userEvent.setup();
    search = "search=ana";
    render(
      <PeopleLayout nodeId="n1">
        <p>x</p>
      </PeopleLayout>,
    );

    await user.click(screen.getByRole("button", { name: "Asistentes" }));

    expect(replace).toHaveBeenCalledWith(
      "/portal/n1/person?search=ana&estado=MEMBERSHIP_IN_PROGRESS",
    );
  });

  it("shows the state in the url as the selected filter and clears it with Todos", async () => {
    const user = userEvent.setup();
    search = "estado=MEMBER";
    render(
      <PeopleLayout nodeId="n1">
        <p>x</p>
      </PeopleLayout>,
    );

    expect(screen.getByRole("button", { name: "Miembros" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "Todos" }));

    expect(replace).toHaveBeenCalledWith("/portal/n1/person?");
  });
});
