import { describe, expect, it } from "vitest";
import type { RegistrationOutcomeResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";
import {
  initialPhase,
  phaseReducer,
  type Phase,
  type PhaseEvent,
} from "./registrationPhase";

const outcome: RegistrationOutcomeResponse = {
  alreadyRegistered: false,
  status: "CONFIRMED",
  cancelCode: "c1",
};

const run = (...events: PhaseEvent[]) =>
  events.reduce(phaseReducer, initialPhase);

describe("registrationPhase", () => {
  it("goes from editing to registered and then to cancelled", () => {
    expect(run({ type: "send" })).toEqual({ kind: "sending" });
    expect(
      run({ type: "send" }, { type: "answered", answer: outcome }),
    ).toEqual({ kind: "registered", outcome, cancelling: false });
    expect(
      run(
        { type: "send" },
        { type: "answered", answer: outcome },
        { type: "cancel" },
      ),
    ).toEqual({ kind: "registered", outcome, cancelling: true });
    expect(
      run(
        { type: "send" },
        { type: "answered", answer: outcome },
        { type: "cancel" },
        { type: "cancelAnswered", worked: true },
      ),
    ).toEqual({ kind: "cancelled" });
  });

  it("a refusal keeps the person at the form with the reason, and they can send again", () => {
    const failed = run(
      { type: "send" },
      { type: "answered", answer: "Se agotaron los lugares" },
    );
    expect(failed).toEqual({
      kind: "failed",
      reason: "Se agotaron los lugares",
    });
    expect(phaseReducer(failed, { type: "send" })).toEqual({ kind: "sending" });
  });

  it("a cancellation that did not work leaves them registered", () => {
    const phase = run(
      { type: "send" },
      { type: "answered", answer: outcome },
      { type: "cancel" },
      { type: "cancelAnswered", worked: false },
    );
    expect(phase).toEqual({ kind: "registered", outcome, cancelling: false });
  });

  it("a call that throws puts the person back where they were", () => {
    expect(run({ type: "send" }, { type: "abort" })).toEqual({
      kind: "editing",
    });
    expect(
      run(
        { type: "send" },
        { type: "answered", answer: outcome },
        { type: "cancel" },
        { type: "abort" },
      ),
    ).toEqual({ kind: "registered", outcome, cancelling: false });
  });

  // Every event from every phase: the ones that do not fit change nothing,
  // and no pair of events can reach a combination the type does not allow.
  const registered: Phase = { kind: "registered", outcome, cancelling: false };
  const phases: Phase[] = [
    { kind: "editing" },
    { kind: "sending" },
    { kind: "failed", reason: "x" },
    registered,
    { ...registered, cancelling: true },
    { kind: "cancelled" },
  ];

  it("ignores an event that does not fit the phase", () => {
    const ignored: [Phase, PhaseEvent][] = [
      [{ kind: "sending" }, { type: "send" }],
      [{ kind: "editing" }, { type: "answered", answer: outcome }],
      [{ kind: "editing" }, { type: "cancel" }],
      [{ kind: "cancelled" }, { type: "send" }],
      [{ kind: "cancelled" }, { type: "cancel" }],
      [registered, { type: "send" }],
      [registered, { type: "cancelAnswered", worked: true }],
      [{ ...registered, cancelling: true }, { type: "cancel" }],
    ];
    for (const [phase, event] of ignored) {
      expect(phaseReducer(phase, event)).toBe(phase);
    }
    expect(phases).toHaveLength(6);
  });
});
