import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { buildDirectoryTree, flattenTree } from "./directoryTree";
import { DirectoryList } from "./DirectoryList";

afterEach(cleanup);

const nodes = flattenTree(
  buildDirectoryTree([
    { id: "c", name: "Iglesia Central", type: "CHURCH" },
    {
      id: "g",
      name: "Jóvenes",
      type: "GROUP",
      parentId: "c",
      description: "Para los de 18 a 30",
      schedule: "Sábados 5 pm",
      memberVisibility: "MEMBERS",
      leaders: ["Ana Ruiz", "Luis Paz"],
    },
    {
      id: "m",
      name: "Alabanza",
      type: "MINISTRY",
      parentId: "c",
      leaders: ["Eva Sol"],
    },
  ]),
);

const setup = () => {
  render(
    <DirectoryList
      nodes={nodes}
      renderPeople={(node) => <p>Gente de {node.name}</p>}
    />,
  );
  return userEvent.setup();
};

describe("DirectoryList", () => {
  it("shows every node with its type, schedule and leaders", () => {
    setup();

    const list = screen.getByRole("list", { name: "Directorio de la iglesia" });
    expect(
      within(list)
        .getAllByRole("heading")
        .map((h) => h.textContent),
    ).toEqual(["Iglesia Central", "Alabanza", "Jóvenes"]);
    expect(screen.getByText("Para los de 18 a 30")).toBeTruthy();
    expect(screen.getByText("Horario: Sábados 5 pm")).toBeTruthy();
    expect(screen.getByText("Líderes: Ana Ruiz, Luis Paz")).toBeTruthy();
    expect(screen.getByText("Líder: Eva Sol")).toBeTruthy();
  });

  it("opens the people of one node at a time", async () => {
    const user = setup();

    expect(screen.queryByText("Gente de Jóvenes")).toBeNull();
    await user.click(
      screen.getByRole("button", { name: "Ver personas de Jóvenes" }),
    );
    expect(screen.getByText("Gente de Jóvenes")).toBeTruthy();
    expect(
      screen.getByText(/Lista visible para: solo los miembros/),
    ).toBeTruthy();

    await user.click(
      screen.getByRole("button", { name: "Ver personas de Alabanza" }),
    );
    expect(screen.getByText("Gente de Alabanza")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Ver personas de Jóvenes" }),
    ).toBeTruthy();
  });

  it("closes the people again", async () => {
    const user = setup();
    const toggle = screen.getByRole("button", {
      name: "Ver personas de Jóvenes",
    });

    await user.click(toggle);
    await user.click(
      screen.getByRole("button", { name: "Ocultar personas de Jóvenes" }),
    );

    expect(
      screen.getByRole("button", { name: "Ver personas de Jóvenes" }),
    ).toBeTruthy();
  });
});
