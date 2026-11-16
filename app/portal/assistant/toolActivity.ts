// What the assistant is doing while a tool runs, from the tool's name. The
// agent names each srtomy-api operation `<method>_<path>` (get_events_id,
// get_people, put_events_id_registration_open...) and has a search tool to
// find the operations it needs.

// The most specific resource first: get_events_id_attendance is about the
// attendance, not the event.
const resources: ReadonlyArray<readonly [string, string]> = [
  ["attendance", "la asistencia"],
  ["registration", "las inscripciones"],
  ["invitations", "las invitaciones"],
  ["positions", "los cargos"],
  ["permissions", "los permisos"],
  ["growth", "el crecimiento"],
  ["people", "las personas"],
  ["events", "los eventos"],
  ["organizations", "la iglesia y sus grupos"],
];

const methods = new Set(["get", "post", "put", "patch", "delete"]);

export const toolActivityLabel = (toolName: string): string => {
  const [method, ...path] = toolName.toLowerCase().split("_");
  if (!method || !methods.has(method)) return "Buscando qué consultar…";
  if (method !== "get") return "Preparando la acción…";
  const resource = resources.find(([segment]) =>
    path.some((part) => part.startsWith(segment)),
  );
  return resource ? `Consultando ${resource[1]}…` : "Consultando los datos…";
};
