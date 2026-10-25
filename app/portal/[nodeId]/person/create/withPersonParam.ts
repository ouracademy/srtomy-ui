// Adds `persona=<id>` to a path of this site, keeping its own query.
export const withPersonParam = (path: string, personId: string): string => {
  const url = new URL(path, "http://srtomy.local");
  url.searchParams.set("persona", personId);
  return `${url.pathname}${url.search}`;
};
