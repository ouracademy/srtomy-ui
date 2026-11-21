import { isAxiosError } from "axios";

// What the rest of the app needs to know about a failed request, without
// importing axios (docs/architecture.md, «Datos»).

// The HTTP status of a failed API call; undefined for anything else (a network
// error, a bug in our code).
export const apiErrorStatus = (error: unknown): number | undefined =>
  isAxiosError(error) ? error.response?.status : undefined;

// The body of the API's error answer (problem+json), when it sent one.
export const apiErrorBody = (
  error: unknown,
): Readonly<Record<string, unknown>> | undefined => {
  if (!isAxiosError(error)) return undefined;
  const data: unknown = error.response?.data;
  return typeof data === "object" && data !== null
    ? (data as Record<string, unknown>)
    : undefined;
};
