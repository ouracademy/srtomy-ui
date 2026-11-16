import type { ScreenContext } from "@/app/(api)/assistant";
import type { Permission } from "@/app/(hooks)/usePermissions";

type Suggestion = Readonly<{ text: string; needs: readonly Permission[] }>;

// Questions that only read: the portal assistant does not change data yet.
// Each one lists every permission its answer needs, so the user is never
// offered something the API would refuse.
const forEvent: Suggestion[] = [
  {
    text: "¿Cuántas personas asistieron a este evento?",
    needs: ["events.read"],
  },
  {
    text: "¿Quiénes se inscribieron a este evento?",
    needs: ["events.read", "registrations.read"],
  },
  { text: "Resume los datos de este evento", needs: ["events.read"] },
];

const forPerson: Suggestion[] = [
  {
    text: "¿A qué grupos y ministerios pertenece esta persona?",
    needs: ["members.read"],
  },
  {
    text: "¿A qué eventos asistió esta persona?",
    needs: ["members.read", "events.read"],
  },
];

const forNode: Suggestion[] = [
  { text: "¿Qué eventos hay esta semana?", needs: ["events.read"] },
  {
    text: "¿Quiénes faltaron al último culto?",
    needs: ["events.read", "members.read"],
  },
  { text: "¿Cuántas personas hay aquí?", needs: ["members.read"] },
  { text: "¿Cuántos visitantes llegaron este mes?", needs: ["members.read"] },
  { text: "¿Qué grupos y ministerios hay?", needs: ["org.read"] },
];

const MAX = 4;

// Three or four questions for the empty panel: about the screen first, then
// about the node.
export const suggestionsFor = (
  context: ScreenContext | undefined,
  can: (permission: Permission) => boolean,
): string[] => {
  if (!context) return [];
  const screen = context.eventId ? forEvent : context.personId ? forPerson : [];
  return [...screen, ...forNode]
    .filter(({ needs }) => needs.every(can))
    .slice(0, MAX)
    .map(({ text }) => text);
};
