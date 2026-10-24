// How an event or course is shared, in the words of the screens. The values
// are the API's; the labels are Spanish.
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

export const linkRoleOptions = ["VIEWER", "REGISTRANT"] as const;
export type LinkRole = (typeof linkRoleOptions)[number];

export const linkRoleLabels: Record<LinkRole, string> = {
  VIEWER: "Puede ver",
  REGISTRANT: "Puede ver e inscribirse",
};

export const shareRoleLabels = { VIEWER: "Lector", EDITOR: "Editor" } as const;
export type ShareRole = keyof typeof shareRoleLabels;

// Signing up through the link is only for courses.
export const linkRolesFor = (isACourse: boolean): LinkRole[] =>
  isACourse ? [...linkRoleOptions] : ["VIEWER"];

// Address of the shared page of an event.
export const sharedEventPath = (slug: string) => `/e/${slug}`;

// A short sentence on who opens the event now, for the dialog.
export const accessSummary = (
  generalAccess: GeneralAccess,
  linkRole: LinkRole,
): string => {
  if (generalAccess === "RESTRICTED") {
    return "Solo ven el evento las personas con acceso.";
  }
  const who =
    generalAccess === "ANYONE_WITH_LINK"
      ? "Cualquiera con el enlace puede"
      : "Las personas de la iglesia con el enlace pueden";
  return linkRole === "REGISTRANT"
    ? `${who} ver el curso e inscribirse.`
    : `${who} ver el evento.`;
};
