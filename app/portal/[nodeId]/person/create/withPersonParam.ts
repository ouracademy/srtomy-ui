// Adds `persona=<id>` to a path of this site, keeping its own query and
// replacing a `persona` it already had.
export const withPersonParam = (path: string, personId: string): string => {
  const at = path.indexOf("?");
  const pathname = at === -1 ? path : path.slice(0, at);
  const params = new URLSearchParams(at === -1 ? "" : path.slice(at + 1));
  params.set("persona", personId);
  return `${pathname}?${params}`;
};
