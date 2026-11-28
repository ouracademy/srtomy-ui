import { describe, expect, it } from "vitest";
import {
  acceptReducer,
  initialAcceptFlow,
  sendsRequest,
  type AcceptEvent,
  type AcceptFlow,
} from "./acceptFlow";

const click = (
  id: string,
  options: { needsName: boolean; hasName?: boolean },
): AcceptEvent => ({
  type: "click",
  id,
  needsName: options.needsName,
  hasName: options.hasName ?? false,
});

const run = (...events: AcceptEvent[]) =>
  events.reduce(acceptReducer, initialAcceptFlow);

describe("acceptFlow", () => {
  it("accepts at once an invitation that needs no name", () => {
    expect(run(click("a", { needsName: false }))).toEqual({
      kind: "accepting",
      id: "a",
      askedName: false,
    });
    expect(run(click("a", { needsName: false }), { type: "answered" })).toEqual(
      { kind: "idle" },
    );
  });

  it("asks for the name on the first click and accepts on the second", () => {
    const asking = run(click("a", { needsName: true }));
    expect(asking).toEqual({
      kind: "askingName",
      id: "a",
      triedWithoutName: false,
    });
    expect(
      acceptReducer(asking, click("a", { needsName: true, hasName: true })),
    ).toEqual({ kind: "accepting", id: "a", askedName: true });
  });

  it("flags the fields when they are empty on the second click", () => {
    expect(
      run(click("a", { needsName: true }), click("a", { needsName: true })),
    ).toEqual({ kind: "askingName", id: "a", triedWithoutName: true });
  });

  it("moves to another invitation by asking again, without the flag", () => {
    expect(
      run(click("a", { needsName: true }), click("b", { needsName: true })),
    ).toEqual({ kind: "askingName", id: "b", triedWithoutName: false });
  });

  it("keeps the fields open after a refusal and closes them after nothing", () => {
    expect(
      run(
        click("a", { needsName: true }),
        click("a", { needsName: true, hasName: true }),
        { type: "answered" },
      ),
    ).toEqual({ kind: "askingName", id: "a", triedWithoutName: false });
  });

  it("ignores every click while a request is in flight", () => {
    const flow: AcceptFlow = { kind: "accepting", id: "a", askedName: false };
    for (const needsName of [true, false]) {
      const event = click("b", { needsName, hasName: true });
      expect(acceptReducer(flow, event)).toBe(flow);
      expect(sendsRequest(flow, event)).toBe(false);
    }
    expect(acceptReducer(initialAcceptFlow, { type: "answered" })).toBe(
      initialAcceptFlow,
    );
  });
});
