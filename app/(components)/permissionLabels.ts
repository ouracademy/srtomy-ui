// Spanish names for the permission catalog of the API. A permission this map
// does not know yet (a newer API) shows its raw value instead of breaking.

const resourceLabels: Record<string, string> = {
  org: "Iglesia, sedes y grupos",
  members: "Personas",
  events: "Eventos y cursos",
  attendance: "Asistencia",
  registrations: "Inscripciones",
  positions: "Cargos",
  iam: "Accesos",
  invitations: "Invitaciones",
};

const permissionLabels: Record<string, string> = {
  "org.read": "Ver los datos de la iglesia, sede, grupo o ministerio",
  "org.update":
    "Editar nombre, dirección, teléfono y redes de la iglesia, sede, grupo o ministerio",
  "org.create_child": "Crear sedes, grupos y ministerios",
  "org.delete": "Eliminar grupos y ministerios",
  "members.read": "Ver personas",
  "members.write": "Crear y editar personas",
  "members.delete": "Eliminar personas",
  "events.read": "Ver eventos y cursos",
  "events.write": "Crear y editar eventos y cursos",
  "attendance.write": "Tomar asistencia",
  "registrations.read": "Ver la inscripción y a quienes se inscribieron",
  "registrations.configure": "Activar, cambiar o quitar la inscripción",
  "registrations.close": "Cerrar y reabrir las inscripciones",
  "registrations.remove": "Quitar a una persona inscrita",
  "positions.manage": "Administrar cargos",
  "iam.read": "Ver quién tiene acceso",
  "iam.manage": "Dar y quitar acceso a otras personas",
  "invitations.send": "Invitar a usar la aplicación",
};

export const resourceLabel = (resource: string) =>
  resourceLabels[resource] ?? resource;

export const permissionLabel = (permission: string) =>
  permissionLabels[permission] ?? permission;
