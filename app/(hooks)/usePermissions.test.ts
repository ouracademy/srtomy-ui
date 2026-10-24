import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePermissions } from "./usePermissions";

const useGetMePermissions = vi.fn();
vi.mock("@/app/(api)/generated", () => ({
  useGetMePermissions: (...args: unknown[]) => useGetMePermissions(...args),
}));

beforeEach(() => useGetMePermissions.mockReset());

describe("usePermissions", () => {
  it("answers from the permissions of the node", () => {
    useGetMePermissions.mockReturnValue({
      data: ["org.read"],
      isLoading: false,
    });

    const { result } = renderHook(() => usePermissions("n1"));

    expect(result.current.can("org.read")).toBe(true);
    expect(result.current.can("org.update")).toBe(false);
    expect(useGetMePermissions).toHaveBeenCalledWith(
      { organizationId: "n1" },
      { swr: { enabled: true } },
    );
  });

  it("allows nothing and does not fetch without a node", () => {
    useGetMePermissions.mockReturnValue({ data: undefined, isLoading: false });

    const { result } = renderHook(() => usePermissions(undefined));

    expect(result.current.can("org.read")).toBe(false);
    expect(useGetMePermissions).toHaveBeenCalledWith(
      { organizationId: "" },
      { swr: { enabled: false } },
    );
  });
});
