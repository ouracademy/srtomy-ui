import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SnackbarContext } from "../(components)/SnackbarContext";
import { PlanLimitNotice } from "./PlanLimitNotice";

const state = vi.hoisted(() => ({
  nodeId: undefined as string | undefined,
  push: vi.fn(),
  handler: undefined as
    undefined | ((n: { code: string; message: string }) => void),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ nodeId: state.nodeId }),
  useRouter: () => ({ push: state.push }),
}));
vi.mock("../(api)/client", () => ({
  setPlanLimitHandler: (handler?: typeof state.handler) => {
    state.handler = handler;
  },
}));

const showMessage = vi.fn();
const renderNotice = () =>
  render(
    <SnackbarContext.Provider value={{ message: "", showMessage }}>
      <PlanLimitNotice />
    </SnackbarContext.Provider>,
  );

beforeEach(() => {
  state.nodeId = "n1";
  state.handler = undefined;
  state.push.mockReset();
  showMessage.mockReset();
});
afterEach(cleanup);

describe("PlanLimitNotice", () => {
  it("shows the text of the API with a way to the plans inside a node", () => {
    renderNotice();

    state.handler?.({
      code: "limit.people",
      message: "Tu plan permite 50 personas.",
    });

    expect(showMessage).toHaveBeenCalledWith("Tu plan permite 50 personas.", {
      label: "Ver planes",
      onClick: expect.any(Function),
    });
    showMessage.mock.calls[0]?.[1].onClick();
    expect(state.push).toHaveBeenCalledWith("/portal/n1/billing");
  });

  it("shows only the text outside a node", () => {
    state.nodeId = undefined;
    renderNotice();

    state.handler?.({
      code: "feature.finances",
      message: "Es del plan Iglesia.",
    });

    expect(showMessage).toHaveBeenCalledWith("Es del plan Iglesia.", undefined);
  });

  it("stops listening when the portal leaves", () => {
    const { unmount } = renderNotice();
    expect(state.handler).toBeDefined();

    unmount();

    expect(state.handler).toBeUndefined();
  });
});
