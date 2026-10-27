import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChurchDirectory } from "./ChurchDirectory";

const directory = vi.fn();
vi.mock("@/app/(api)/generated", () => ({
  useGetOrganizationsByChurchIdDirectory: (...args: unknown[]) =>
    directory(...args),
  useGetOrganizationsByNodeIdDirectoryEntry: () => ({
    data: undefined,
    error: undefined,
    isLoading: true,
  }),
}));

beforeEach(() => directory.mockReset());
afterEach(cleanup);

describe("ChurchDirectory", () => {
  it("shows a spinner while the directory loads", () => {
    directory.mockReturnValue({ data: undefined, isLoading: true });

    render(<ChurchDirectory churchId="c1" />);

    expect(screen.getByLabelText("Cargando")).toBeTruthy();
    expect(directory).toHaveBeenCalledWith("c1");
  });

  it("lists the nodes of the church", () => {
    directory.mockReturnValue({
      data: [
        { id: "c1", name: "Iglesia Vida", type: "CHURCH", leaders: [] },
        {
          id: "g1",
          name: "Jóvenes",
          type: "GROUP",
          parentId: "c1",
          leaders: ["Ana Ruiz"],
        },
      ],
      isLoading: false,
    });

    render(<ChurchDirectory churchId="c1" />);

    expect(screen.getByText("Jóvenes")).toBeTruthy();
  });
});
