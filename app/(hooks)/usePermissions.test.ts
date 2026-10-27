import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { hasManagementAccess, usePermissions } from "./usePermissions";

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

describe("hasManagementAccess", () => {
  it("is false for the plain Member level or nothing at all", () => {
    expect(hasManagementAccess([])).toBe(false);
    expect(hasManagementAccess(["org.read", "events.read"])).toBe(false);
  });

  it("is true as soon as one permission goes beyond the Member level", () => {
    expect(hasManagementAccess(["org.read", "members.read"])).toBe(true);
    expect(hasManagementAccess(["events.read", "attendance.write"])).toBe(true);
  });
});

describe("usePermissions list", () => {
  it("exposes the permissions it was given", () => {
    useGetMePermissions.mockReturnValue({
      data: ["org.read", "events.read"],
      isLoading: false,
    });

    const { result } = renderHook(() => usePermissions("n1"));

    expect(result.current.permissions).toEqual(["org.read", "events.read"]);
  });
});
