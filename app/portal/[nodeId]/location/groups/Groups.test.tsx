import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Groups } from "./Groups";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/app/(api)/generated", () => ({
  deleteOrganizationsById: vi.fn(),
  useGetOrganizationsByIdChilds: () => ({
    data: [
      { id: "1", name: "Jóvenes", type: "GROUP" },
      { id: "2", name: "Alabanza", type: "MINISTRY" },
    ],
    isLoading: false,
    mutate: vi.fn(),
  }),
}));

afterEach(cleanup);

describe("Groups", () => {
  it("has an add link with the add icon and a search box", () => {
    render(<Groups nodeId="n" canCreate />);

    expect(screen.getByRole("link", { name: "Agregar" })).toHaveAttribute(
      "href",
      "/portal/n/location/groups/create",
    );
    expect(screen.getByTestId("AddIcon")).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Buscar por nombre" }),
    ).toBeInTheDocument();
  });

  it("filters the rows by name", async () => {
    const user = userEvent.setup();
    render(<Groups nodeId="n" />);
    expect(screen.getByText("Alabanza")).toBeInTheDocument();

    await user.type(
      screen.getByRole("textbox", { name: "Buscar por nombre" }),
      "jove",
    );

    expect(screen.getByText("Jóvenes")).toBeInTheDocument();
    expect(screen.queryByText("Alabanza")).not.toBeInTheDocument();
  });
});
