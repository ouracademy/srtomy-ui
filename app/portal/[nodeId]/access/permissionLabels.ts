// Spanish names for the permission catalog of the API. A permission this map
// does not know yet (a newer API) shows its raw value instead of breaking.
const resourceLabels: Record<string, string> = {
  org: "Estructura",
  members: "Personas",
  events: "Eventos y cursos",
  attendance: "Asistencia",
  positions: "Cargos",
  iam: "Accesos",
};

const permissionLabels: Record<string, string> = {
  "org.read": "Ver información",
  "org.update": "Editar datos",
  "org.create_child": "Crear sedes, grupos y ministerios",
  "org.delete": "Eliminar grupos y ministerios",
  "members.read": "Ver personas",
  "members.write": "Crear y editar personas",
  "events.read": "Ver eventos y cursos",
  "events.write": "Crear y editar eventos y cursos",
  "attendance.write": "Tomar asistencia",
  "positions.manage": "Administrar cargos",
  "iam.read": "Ver accesos",
  "iam.manage": "Otorgar y quitar accesos y roles",
};

export const resourceLabel = (resource: string) =>
  resourceLabels[resource] ?? resource;

export const permissionLabel = (permission: string) =>
  permissionLabels[permission] ?? permission;
