import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Groups } from "./Groups";

const replace = vi.fn();
let query = "";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
  usePathname: () => "/portal/n/groups",
  useSearchParams: () => new URLSearchParams(query),
}));
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

beforeEach(() => {
  replace.mockClear();
  query = "";
});

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

    await vi.waitFor(() =>
      expect(screen.queryByText("Alabanza")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Jóvenes")).toBeInTheDocument();
  });

  it("puts the search in the url once, after the typing pauses", async () => {
    const user = userEvent.setup();
    render(<Groups nodeId="n" />);
    expect(replace).not.toHaveBeenCalled();

    await user.type(
      screen.getByRole("textbox", { name: "Buscar por nombre" }),
      "ala",
    );

    await vi.waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/portal/n/groups?search=ala"),
    );
    expect(replace).toHaveBeenCalledTimes(1);
  });

  it("starts from the search in the url", () => {
    query = "search=ala";
    render(<Groups nodeId="n" />);

    expect(
      screen.getByRole("textbox", { name: "Buscar por nombre" }),
    ).toHaveValue("ala");
    expect(screen.queryByText("Jóvenes")).not.toBeInTheDocument();
    expect(screen.getByText("Alabanza")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
