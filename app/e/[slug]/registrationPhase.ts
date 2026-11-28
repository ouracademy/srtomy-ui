import type { RegistrationOutcomeResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";

// Where the sign-up of a shared event stands. One value instead of the flags
// sending, cancelling, cancelled and an outcome that was either text or an
// object: with flags, "sending and cancelling" or "cancelled without ever
// signing up" could be written; here they cannot.
export type Phase =
  | { kind: "editing" }
  | { kind: "sending" }
  // The API refused; the form stays open and the person can try again.
  | { kind: "failed"; reason: string }
  // They have a place; `cancelling` while the cancellation is in flight.
  | {
      kind: "registered";
      outcome: RegistrationOutcomeResponse;
      cancelling: boolean;
    }
  | { kind: "cancelled" };

export type PhaseEvent =
  | { type: "send" }
  // How the sign-up went: the outcome, or the reason when it failed.
  | { type: "answered"; answer: RegistrationOutcomeResponse | string }
  | { type: "cancel" }
  | { type: "cancelAnswered"; worked: boolean }
  // The call itself threw: go back to where the person was.
  | { type: "abort" };

export const initialPhase: Phase = { kind: "editing" };

// An event that does not fit the phase (a second click while sending, an
// answer nobody asked for) leaves it as it is.
export const phaseReducer = (phase: Phase, event: PhaseEvent): Phase => {
  switch (event.type) {
    case "send":
      return phase.kind === "editing" || phase.kind === "failed"
        ? { kind: "sending" }
        : phase;
    case "answered":
      if (phase.kind !== "sending") return phase;
      return typeof event.answer === "string"
        ? { kind: "failed", reason: event.answer }
        : { kind: "registered", outcome: event.answer, cancelling: false };
    case "cancel":
      return phase.kind === "registered" && !phase.cancelling
        ? { ...phase, cancelling: true }
        : phase;
    case "cancelAnswered":
      if (phase.kind !== "registered" || !phase.cancelling) return phase;
      return event.worked
        ? { kind: "cancelled" }
        : { ...phase, cancelling: false };
    case "abort":
      if (phase.kind === "sending") return { kind: "editing" };
      return phase.kind === "registered"
        ? { ...phase, cancelling: false }
        : phase;
  }
};
