import type { RoleResponse } from "@/app/(api)/generated/aPISrTommy.schemas";

// A position (cargo) may carry an access level; without one it is only a label
// for people who do not use the app. Forms keep "no level" as this value
// because a select cannot hold undefined.
export const NO_LEVEL = "none";
export const NO_LEVEL_LABEL = "Sin acceso a la app";

/** Levels a position can have: Owner is never one (the API marks it). */
export const assignableLevels = (levels: RoleResponse[]) =>
  levels.filter((level) => level.assignable !== false);

/** The id of the level called `name`, or NO_LEVEL when the church has none. */
export const levelIdByName = (levels: RoleResponse[], name: string) =>
  levels.find((level) => level.name === name)?.id ?? NO_LEVEL;

/** The level id to send, or undefined for a plain label. */
export const toAccessRoleId = (level: string) =>
  level === NO_LEVEL || level === "" ? undefined : level;

export const levelLabel = (
  levels: RoleResponse[],
  accessRoleId: string | null | undefined,
) =>
  accessRoleId
    ? (levels.find((level) => level.id === accessRoleId)?.name ??
      "Con acceso a la app")
    : NO_LEVEL_LABEL;
