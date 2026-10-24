import { isAxiosError } from "axios";

// The API explains 400 and 403 answers in Spanish (problem+json `detail`):
// show it when there is one, otherwise the generic fallback.
export const apiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)
      ?.detail;
    if (typeof detail === "string" && detail.trim()) return detail;
  }
  return fallback;
};
