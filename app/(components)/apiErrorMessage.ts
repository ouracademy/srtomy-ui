import { apiErrorBody } from "@/app/(api)/apiError";

// The API explains 400 and 403 answers in Spanish (problem+json `detail`):
// show it when there is one, otherwise the generic fallback.
export const apiErrorMessage = (error: unknown, fallback: string) => {
  const detail = apiErrorBody(error)?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  return fallback;
};
