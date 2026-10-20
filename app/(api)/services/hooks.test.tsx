import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { describe, expect, it, vi } from "vitest";

vi.stubEnv("NEXT_PUBLIC_AUTH0_DOMAIN", "tenant.example.com");
vi.stubEnv("NEXT_PUBLIC_AUTH0_CLIENT_ID", "client");
vi.stubEnv("NEXT_PUBLIC_API_URL", "http://api.test");

const events = await import("./events");
const organizations = await import("./organizations");
const people = await import("./people");

// Renders a hook with a fake SWR fetcher and returns the keys it asked for.
const requestedKeys = async (useHook: () => unknown) => {
  const fetcher = vi.fn().mockResolvedValue(null);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SWRConfig value={{ fetcher, provider: () => new Map() }}>
      {children}
    </SWRConfig>
  );

  renderHook(useHook, { wrapper });
  await waitFor(() => expect(fetcher.mock.calls.length).toBeGreaterThan(0));
  return fetcher.mock.calls.map(([key]) => key);
};

describe("SWR hooks request the documented endpoints", () => {
  it.each([
    ["usePerson", () => people.usePerson(7), "/people/7"],
    [
      "usePersonRoles",
      () => people.usePersonRoles(12, 7),
      "/organizations/locations/12/person/7/roles",
    ],
    [
      "useOrganization",
      () => organizations.useOrganization(12),
      "/organizations/12",
    ],
    [
      "useLocations",
      () => organizations.useLocations(12),
      "/organizations/12/childs",
    ],
    [
      "useGroups",
      () => organizations.useGroups(12),
      "/organizations/12/childs",
    ],
    [
      "useGroupMembers",
      () => organizations.useGroupMembers(4),
      "/organizations/locations/childs/4/members",
    ],
    [
      "useLocationRoles",
      () => organizations.useLocationRoles(12),
      "/organizations/locations/12/roles",
    ],
    [
      "usePredefinedRoles",
      () => organizations.usePredefinedRoles(),
      "/organizations/locations/predefined-roles",
    ],
    [
      "useMemberStates",
      () => organizations.useMemberStates(12),
      "/organizations/12/member-state",
    ],
    ["useEvent", () => events.useEvent(3), "/events/3"],
    [
      "useEventAttendance",
      () => events.useEventAttendance(3),
      "/events/3/attendance",
    ],
  ])("%s", async (_name, useHook, expectedKey) => {
    expect(await requestedKeys(useHook)).toEqual([expectedKey]);
  });

  it("usePeople sends the filters as query params and drops an empty search", async () => {
    const keys = await requestedKeys(() =>
      people.usePeople({
        organizationId: 12,
        page: 1,
        size: 25,
        searchText: "",
      }),
    );

    expect(keys).toEqual([
      [
        "/people",
        {
          params: {
            organizationId: 12,
            page: 1,
            size: 25,
            searchText: undefined,
          },
        },
      ],
    ]);
  });

  it("does not request anything while the id is unknown", async () => {
    const fetcher = vi.fn();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <SWRConfig value={{ fetcher, provider: () => new Map() }}>
        {children}
      </SWRConfig>
    );

    renderHook(
      () => [
        organizations.useOrganization(undefined),
        organizations.useLocations(undefined),
      ],
      { wrapper },
    );
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(fetcher).not.toHaveBeenCalled();
  });
});
