/**
 * Returns the query string with `key` set to `value` (or removed when the value
 * is empty), or `null` when the URL already holds it. Returning `null` is what
 * keeps the URL-sync effects from navigating again after their own navigation.
 */
export function queryWith(
  current: string,
  key: string,
  value: string,
): string | null {
  const params = new URLSearchParams(current);
  if ((params.get(key) ?? "") === value) {
    return null;
  }
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
  return params.toString();
}

/** Same as {@link queryWith} for the `search` parameter. */
export function searchQueryFor(current: string, text: string): string | null {
  return queryWith(current, "search", text);
}
