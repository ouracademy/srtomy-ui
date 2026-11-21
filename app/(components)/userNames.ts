type LoginProfile = {
  given_name?: string;
  family_name?: string;
  name?: string;
};

export type PersonName = { firstName: string; lastName: string };

const NONE: PersonName = { firstName: "", lastName: "" };

/**
 * First and last name to propose from the sign-in profile. Providers like
 * Google send them apart; otherwise `name` is split at the first space, which
 * can be wrong for compound names, so it is only a suggestion. A name that is
 * really an email (what password sign-ups often get) proposes nothing.
 */
export const suggestedNames = (profile?: LoginProfile): PersonName => {
  if (!profile) return NONE;
  const given = profile.given_name?.trim() ?? "";
  const family = profile.family_name?.trim() ?? "";
  if (given || family) return { firstName: given, lastName: family };

  const full = profile.name?.trim() ?? "";
  if (!full || full.includes("@")) return NONE;
  const [first = "", ...rest] = full.split(/\s+/);
  return { firstName: first, lastName: rest.join(" ") };
};
