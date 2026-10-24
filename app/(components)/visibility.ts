import { z } from "zod";

// Who sees the list of people of a church, location, group or ministry. The
// basic information of the node (name, description, schedule, leaders) is
// always in the church directory.
export const memberVisibilities = [
  "PUBLIC",
  "CHURCH",
  "MEMBERS",
  "LEADERS",
] as const;

export type MemberVisibility = (typeof memberVisibilities)[number];

export const memberVisibilityLabels: Record<
  MemberVisibility,
  { label: string; help: string }
> = {
  PUBLIC: {
    label: "Cualquiera con el enlace",
    help: "La página pública del nodo la ve cualquier persona, sin iniciar sesión.",
  },
  CHURCH: {
    label: "Toda la iglesia",
    help: "Cualquier persona con acceso en la iglesia ve la lista.",
  },
  MEMBERS: {
    label: "Solo los miembros",
    help: "La ven los miembros del nodo y quienes pueden ver personas allí.",
  },
  LEADERS: {
    label: "Solo líderes",
    help: "La ven solo quienes pueden ver personas en el nodo. El nodo no sale en la página pública.",
  },
};

export const visibilitySchema = z.object({
  schedule: z.string(),
  memberVisibility: z.enum(memberVisibilities),
  showOrgChart: z.boolean(),
});

export type VisibilityForm = z.infer<typeof visibilitySchema>;

export const defaultVisibility: VisibilityForm = {
  schedule: "",
  memberVisibility: "PUBLIC",
  showOrgChart: true,
};

type VisibilitySource = {
  schedule?: string;
  memberVisibility?: string;
  showOrgChart?: boolean;
};

const isVisibility = (value: string | undefined): value is MemberVisibility =>
  (memberVisibilities as readonly string[]).includes(value ?? "");

// What a node came with from the API; a node without the data (an older API)
// gets the defaults.
export const toVisibilityForm = (node: VisibilitySource): VisibilityForm => ({
  schedule: node.schedule ?? "",
  memberVisibility: isVisibility(node.memberVisibility)
    ? node.memberVisibility
    : defaultVisibility.memberVisibility,
  showOrgChart: node.showOrgChart ?? defaultVisibility.showOrgChart,
});

// The part of the request that carries the visibility settings.
export const toVisibilityRequest = (values: VisibilityForm) => ({
  schedule: values.schedule.trim(),
  memberVisibility: values.memberVisibility,
  showOrgChart: values.showOrgChart,
});

// Address of the public page of a node, from the slug the API gives.
export const publicPagePath = (slug: string) => `/g/${slug}`;
