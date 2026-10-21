import { parseISO } from "date-fns";

const isoDateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?$/;

// see: https://stackoverflow.com/questions/28020805/regex-validate-correct-iso8601-date-string-with-time
const isoZonedDateFormat =
  /^(?:[1-9]\d{3}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1\d|2[0-8])|(?:0[13-9]|1[0-2])-(?:29|30)|(?:0[13578]|1[02])-31)|(?:[1-9]\d(?:0[48]|[2468][048]|[13579][26])|(?:[2468][048]|[13579][26])00)-02-29)T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:Z|[+-][01]\d:[0-5]\d)$/;

const isIsoDateString = (value: unknown): value is string =>
  typeof value === "string" && isoDateFormat.test(value);

const isIsoZonedDateString = (value: unknown): value is string =>
  typeof value === "string" && isoZonedDateFormat.test(value);

/**
 * Replaces, in place, the ISO date-times of an API response body (at any
 * depth) with Date objects. Date-only strings (yyyy-MM-dd) are left as they
 * are: a schema parses them where needed (see PersonResponseSchema).
 *
 * See: https://stackoverflow.com/questions/65692061/casting-dates-properly-from-an-api-response-in-typescript
 */
export function handleDates(body: unknown): void {
  if (body === null || typeof body !== "object") return;

  const record = body as Record<string, unknown>;
  for (const [key, value] of Object.entries(record)) {
    if (isIsoDateString(value)) record[key] = parseISO(value);
    else if (isIsoZonedDateString(value)) record[key] = new Date(value);
    else handleDates(value);
  }
}
