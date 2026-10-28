// How an event or course is shared, in the words of the screens. The values
// are the API's; the labels are Spanish. Signing up is not part of sharing: the
// link only lets people see the event (see registration.ts).
export const generalAccessOptions = [
  "RESTRICTED",
  "CHURCH",
  "ANYONE_WITH_LINK",
] as const;
export type GeneralAccess = (typeof generalAccessOptions)[number];

export const generalAccessLabels: Record<
  GeneralAccess,
  { label: string; help: string }
> = {
  RESTRICTED: {
    label: "Restringido",
    help: "Solo lo abren quienes tienen acceso por la iglesia o a quienes se lo compartió.",
  },
  CHURCH: {
    label: "Toda la iglesia",
    help: "Lo abre cualquier persona con acceso en la iglesia que tenga el enlace.",
  },
  ANYONE_WITH_LINK: {
    label: "Cualquiera con el enlace",
    help: "Lo abre cualquier persona con el enlace, sin iniciar sesión.",
  },
};

export const shareRoleLabels = { VIEWER: "Lector", EDITOR: "Editor" } as const;
export type ShareRole = keyof typeof shareRoleLabels;

// Address of the shared page of an event.
export const sharedEventPath = (slug: string) => `/e/${slug}`;

// A short sentence on who opens the event now, for the dialog.
export const accessSummary = (generalAccess: GeneralAccess): string => {
  switch (generalAccess) {
    case "RESTRICTED":
      return "Solo ven el evento las personas con acceso.";
    case "CHURCH":
      return "Las personas de la iglesia con el enlace pueden ver el evento.";
    case "ANYONE_WITH_LINK":
      return "Cualquiera con el enlace puede ver el evento.";
  }
};

export type PendingShare = { email: string; role: ShareRole };

// What the user changed in the dialog and has not saved yet.
export type SharingDraft = {
  generalAccess: GeneralAccess;
  // People to share with (or whose role changes), by email.
  added: PendingShare[];
  // Ids of the shares to take away.
  removed: string[];
};

export const emailLooksValid = (email: string) =>
  /^\S+@\S+\.\S+$/.test(email.trim());

export const hasUnsavedChanges = (
  saved: GeneralAccess,
  draft: SharingDraft,
): boolean =>
  draft.generalAccess !== saved ||
  draft.added.length > 0 ||
  draft.removed.length > 0;

// Adds a person to the draft; adding the same email again replaces the role.
export const withShare = (
  added: PendingShare[],
  share: PendingShare,
): PendingShare[] => [
  ...added.filter(
    (item) => item.email.toLowerCase() !== share.email.toLowerCase(),
  ),
  share,
];
