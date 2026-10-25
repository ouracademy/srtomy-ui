import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PeopleList } from "./PeopleList";

afterEach(cleanup);

describe("PeopleList", () => {
  it("lists the names", () => {
    render(
      <PeopleList
        entry={{ membersVisible: true, members: ["Ana Ruiz", "Luis Paz"] }}
      />,
    );

    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual(["Ana Ruiz", "Luis Paz"]);
  });

  it("says so when there is nobody", () => {
    render(<PeopleList entry={{ membersVisible: true, members: [] }} />);

    expect(screen.getByText("Aún no hay personas.")).toBeTruthy();
  });

  it("explains that the list is hidden, without showing names", () => {
    render(
      <PeopleList
        entry={{ membersVisible: false, members: ["Secreto Uno"] }}
      />,
    );

    expect(screen.getByText(/no sea visible para usted/)).toBeTruthy();
    expect(screen.queryByText("Secreto Uno")).toBeNull();
  });
});
