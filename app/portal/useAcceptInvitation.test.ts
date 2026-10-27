import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAcceptInvitation } from "./useAcceptInvitation";

const accept = vi.fn();
const mutate = vi.fn();
vi.mock("@/app/(api)/generated", () => ({
  postMeInvitationsByIdAccept: (...args: unknown[]) => accept(...args),
  useGetMeOrganizations: () => ({ mutate }),
}));

beforeEach(() => {
  accept.mockReset();
  mutate.mockReset();
});

describe("useAcceptInvitation", () => {
  it("accepts, refreshes the tree and tells where the user joined", async () => {
    accept.mockResolvedValue({ organizationId: "n1" });
    const onJoined = vi.fn();
    const { result } = renderHook(() => useAcceptInvitation(onJoined));

    let failure: string | undefined;
    await act(async () => {
      failure = await result.current(
        { id: "i1" },
        {
          firstName: "Ana",
          lastName: "Ruiz",
        },
      );
    });

    expect(failure).toBeUndefined();
    expect(accept).toHaveBeenCalledWith("i1", {
      firstName: "Ana",
      lastName: "Ruiz",
    });
    expect(mutate).toHaveBeenCalled();
    expect(onJoined).toHaveBeenCalledWith({ organizationId: "n1" });
  });

  it("returns a message and does not move on when it is refused", async () => {
    accept.mockRejectedValue(new Error("no"));
    const onJoined = vi.fn();
    const { result } = renderHook(() => useAcceptInvitation(onJoined));

    let failure: string | undefined;
    await act(async () => {
      failure = await result.current({ id: "i1" });
    });

    expect(failure).toBeTruthy();
    expect(onJoined).not.toHaveBeenCalled();
  });
});
