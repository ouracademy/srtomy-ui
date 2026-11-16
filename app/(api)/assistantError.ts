// Kept apart from assistant.ts so code that only reads errors does not load
// the environment (env.ts) to get them.

// A failed request to POST /chat, with what the panel needs to explain it.
// 401 also covers a session Auth0 could not renew (no token to send).
export class AssistantRequestError extends Error {
  readonly status: number;
  readonly retryAfterSeconds: number | undefined;

  constructor(status: number, retryAfterSeconds?: number) {
    super(`The assistant answered ${status}`);
    this.name = "AssistantRequestError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

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
