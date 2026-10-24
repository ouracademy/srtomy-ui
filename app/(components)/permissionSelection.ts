// Adds the permission when it is missing and removes it when present.
export const togglePermission = (selected: string[], permission: string) =>
  selected.includes(permission)
    ? selected.filter((value) => value !== permission)
    : [...selected, permission];

// Selects or clears a whole resource group at once, leaving the rest alone.
export const setGroup = (
  selected: string[],
  group: string[],
  checked: boolean,
) => {
  const others = selected.filter((value) => !group.includes(value));
  return checked ? [...others, ...group] : others;
};
