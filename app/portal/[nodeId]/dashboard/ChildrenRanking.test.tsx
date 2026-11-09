import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChildrenRanking } from "./ChildrenRanking";

const api = vi.hoisted(() => ({
  getOrganizationsByIdGrowthRange: vi.fn(),
}));
vi.mock("@/app/(api)/generated", () => api);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ChildrenRanking", () => {
  it("fetches each direct child's growth range and renders the chart", async () => {
    api.getOrganizationsByIdGrowthRange.mockImplementation((id: string) =>
      Promise.resolve({ current: { total: id === "a" ? 5 : 20 } }),
    );

    render(
      <ChildrenRanking
        childNodes={[
          { id: "a", name: "Grupo A" },
          { id: "b", name: "Grupo B" },
        ]}
        startDate="2026-10-24"
        endDate="2026-10-30"
      />,
    );

    await waitFor(() => expect(screen.getByText("Por grupo")).toBeTruthy());

    expect(api.getOrganizationsByIdGrowthRange).toHaveBeenCalledWith("a", {
      startDate: "2026-10-24",
      endDate: "2026-10-30",
    });
    expect(api.getOrganizationsByIdGrowthRange).toHaveBeenCalledWith("b", {
      startDate: "2026-10-24",
      endDate: "2026-10-30",
    });
  });

  it("renders nothing without children", () => {
    const { container } = render(
      <ChildrenRanking
        childNodes={[]}
        startDate="2026-10-24"
        endDate="2026-10-30"
      />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(api.getOrganizationsByIdGrowthRange).not.toHaveBeenCalled();
  });
});
