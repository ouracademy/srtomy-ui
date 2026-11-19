import type { PersonResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";

type SignedInUser = {
  name?: string;
  given_name?: string;
  family_name?: string;
};

// Lowercase, no accents and single spaces, so "André  Mauricio" matches
// "andre mauricio".
const fold = (text: string | undefined) =>
  (text ?? "")
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .join(" ");

// Whether this person of the list is the signed-in user. The API does not link
// the account to its person, so it is decided by the name: the one shown in
// the header, either as a whole or as first and last name.
export const isCurrentUser = (
  person: PersonResponse,
  user: SignedInUser | undefined,
): boolean => {
  const personName = fold(person.fullName);
  if (!personName || !user) return false;
  return [
    user.name,
    [user.given_name, user.family_name].filter(Boolean).join(" "),
  ].some((candidate) => fold(candidate) === personName);
};
