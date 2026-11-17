// Kept apart from assistant.ts so code that only reads errors does not load
// the environment (env.ts) to get them.

// A failed request to POST /chat, with what the panel needs to explain it.
// 401 also covers a session Auth0 could not renew (no token to send).
export class AssistantRequestError extends Error {
  readonly status: number;
  readonly retryAfterSeconds: number | undefined;
  // Why the plan refused (402): the agent answers `{ error, code }` with the
  // code `ai.quota`, `ai.spend` or `ai.plan` and a text in Spanish.
  readonly limit: PlanLimit | undefined;

  constructor(status: number, retryAfterSeconds?: number, limit?: PlanLimit) {
    super(`The assistant answered ${status}`);
    this.name = "AssistantRequestError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
    this.limit = limit;
  }
}

export type PlanLimit = { code: string; message: string };

// The body of a refusal of the plan, or undefined if it is anything else. A
// missing text falls back to a generic one: the person must always be told.
export const planLimitFrom = (body: unknown): PlanLimit | undefined => {
  if (typeof body !== "object" || body === null) return undefined;
  const { code, error } = body as { code?: unknown; error?: unknown };
  if (typeof code !== "string" || !code.startsWith("ai.")) return undefined;
  return {
    code,
    message:
      typeof error === "string" && error.trim()
        ? error
        : "El asistente llegó al límite de tu plan.",
  };
};

// Retry-After comes in seconds or as an HTTP date.
export const parseRetryAfter = (
  value: string | null,
  now: number = Date.now(),
): number | undefined => {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, Math.ceil(seconds));
  const date = Date.parse(value);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, Math.ceil((date - now) / 1000));
};
