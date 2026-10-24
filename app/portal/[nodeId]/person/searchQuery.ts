/**
 * Returns the query string with `search` set to `text`, or `null` when the URL
 * already holds that search. Returning `null` is what keeps the URL-sync effect
 * from navigating again after its own navigation.
 */
export function searchQueryFor(current: string, text: string): string | null {
  const params = new URLSearchParams(current);
  if ((params.get("search") ?? "") === text) {
    return null;
  }
  if (text) {
    params.set("search", text);
  } else {
    params.delete("search");
  }
  return params.toString();
}
