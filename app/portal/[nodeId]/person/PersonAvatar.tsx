import { Avatar } from "@mui/material";
import type { PersonResponse } from "@/app/(api)/generated/aPIOvejafiel.schemas";

// Dark enough for white text to pass the 4.5:1 contrast of WCAG AA.
const tones = [
  "#1565c0",
  "#00796b",
  "#6a1b9a",
  "#c2410c",
  "#4e5d78",
  "#b0396b",
  "#2e7d32",
  "#8a6d00",
];

const firstLetter = (text: string | undefined) =>
  text?.trim().charAt(0).toUpperCase() ?? "";

// Two letters: first name and last name. Falls back to the first two words of
// the full name, and to "?" when the person has no name at all.
export const personInitials = (person: PersonResponse): string => {
  const fromParts =
    firstLetter(person.firstName) + firstLetter(person.lastName);
  if (fromParts.length === 2) return fromParts;
  const words = (person.fullName ?? "").trim().split(/\s+/).filter(Boolean);
  const fromWords = words
    .slice(0, 2)
    .map((word) => firstLetter(word))
    .join("");
  return fromParts || fromWords || "?";
};

// The same person always gets the same color.
export const toneFor = (key: string): string => {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return tones[hash % tones.length] ?? "#1565c0";
};

// The photo of a person is not in the API yet: their initials stand in for it.
export const PersonAvatar = ({
  person,
}: Readonly<{ person: PersonResponse }>) => (
  <Avatar
    aria-hidden
    sx={{
      width: 44,
      height: 44,
      fontSize: 15,
      fontWeight: 500,
      bgcolor: toneFor(person.id ?? person.fullName ?? ""),
      color: "#ffffff",
    }}
  >
    {personInitials(person)}
  </Avatar>
);
