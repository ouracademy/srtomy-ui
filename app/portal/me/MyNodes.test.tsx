import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { MyNodeResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import { MyNodes } from "./MyNodes";

afterEach(cleanup);

const nodes: MyNodeResponse[] = [
  {
    id: "g1",
    name: "Alabanza",
    type: "MINISTRY",
    churchId: "c",
    churchName: "Iglesia Vida",
    positions: ["Tesorero"],
  },
  {
    id: "g2",
    name: "Jóvenes",
    type: "GROUP",
    churchId: "c",
    churchName: "Iglesia Vida",
    positions: [],
  },
];

describe("MyNodes", () => {
  it("says so when the user is in no group", () => {
    render(<MyNodes nodes={[]} />);

    expect(screen.getByText(/Todavía no figuras/)).toBeTruthy();
  });

  it("links each node and shows the positions the user holds there", () => {
    render(<MyNodes nodes={nodes} />);

    const items = within(
      screen.getByRole("list", { name: "Mis grupos y ministerios" }),
    ).getAllByRole("listitem");
    const [first] = items as [HTMLElement];
    expect(items).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "Alabanza" }).getAttribute("href"),
    ).toBe("/portal/g1");
    expect(within(first).getByText(/Ministerio · Iglesia Vida/)).toBeTruthy();
    expect(within(first).getByText("Tesorero")).toBeTruthy();
  });
});
