import type {
  PositionResponse,
  PositionSummaryResponse,
} from "@/app/(api)/generated/aPIOvejafiel.schemas";

// A position picked in the person form: an existing one (with id) or a name
// typed by the user that the church does not have yet.
export type PositionChoice = { id?: string; label: string };

export const toPositionChoice = (
  position: PositionResponse,
): PositionChoice => ({
  id: position.id,
  label: position.name ?? "",
});

/** A typed name that matches an existing position (ignoring case) reuses it. */
export const toChoice = (
  value: PositionChoice | string,
  positions: PositionResponse[],
): PositionChoice => {
  if (typeof value !== "string") return value;
  const label = value.trim();
  const existing = positions.find(
    (p) =>
      (p.name ?? "").toLocaleLowerCase("es") === label.toLocaleLowerCase("es"),
  );
  return existing ? toPositionChoice(existing) : { label };
};

/** Ids to send for the person, creating first the positions that are new. */
export const resolvePositionIds = async (
  choices: PositionChoice[],
  create: (name: string) => Promise<PositionResponse>,
): Promise<string[]> => {
  const ids: string[] = [];
  for (const choice of choices) {
    const id = choice.id ?? (await create(choice.label)).id;
    if (id) ids.push(id);
  }
  return ids;
};

/**
 * What the chosen positions allow in the app, e.g. "Pastor: 12 permisos". New
 * names (no id yet) are plain labels, so they say nothing.
 */
export const accessHints = (
  choices: PositionChoice[],
  positions: PositionSummaryResponse[],
) =>
  choices.flatMap((choice) => {
    const position = positions.find((p) => p.id && p.id === choice.id);
    const count = position?.effectivePermissions?.length ?? 0;
    return position && count > 0
      ? [`${position.name}: ${count} ${count === 1 ? "permiso" : "permisos"}`]
      : [];
  });
