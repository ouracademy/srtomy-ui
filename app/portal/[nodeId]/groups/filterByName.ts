// Lowercase and strip accents so "ninos" finds "Niños".
const fold = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

// Keeps the items whose name contains the search text; blank shows them all.
export const filterByName = <T extends { name?: string }>(
  items: T[],
  search: string,
): T[] => {
  const needle = fold(search.trim());
  if (!needle) return items;
  return items.filter((item) => fold(item.name ?? "").includes(needle));
};
