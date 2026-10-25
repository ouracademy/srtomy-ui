// Spanish names for the permission catalog of the API. A permission this map
// does not know yet (a newer API) shows its raw value instead of breaking.
//
// A role is granted on a node (church, location, group or ministry) and
// reaches everything below it. Two wordings follow from that:
// - Neutral (no node): where roles are defined, for the whole church, the node
//   they will be granted on is not known yet.
// - For a node type: where a role is granted, the labels that depend on the
//   kind of node name it and say how far the role reaches.

export type NodeType = "CHURCH" | "LOCATION" | "GROUP" | "MINISTRY";

const resourceLabels: Record<string, string> = {
  org: "Iglesia, sedes y grupos",
  members: "Personas",
  events: "Eventos y cursos",
  attendance: "Asistencia",
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
  "events.read": "Ver eventos y cursos",
  "events.write": "Crear y editar eventos y cursos",
  "attendance.write": "Tomar asistencia",
  "positions.manage": "Administrar cargos",
  "iam.read": "Ver quién tiene acceso",
  "iam.manage": "Dar y quitar acceso a otras personas",
  "invitations.send": "Invitar a usar la aplicación",
};

// What the node is called and what hangs from it.
const scopes: Record<NodeType, { self: string; contents: string }> = {
  CHURCH: {
    self: "esta iglesia",
    contents: "todas sus sedes, grupos y ministerios",
  },
  LOCATION: { self: "esta sede", contents: "sus grupos y ministerios" },
  GROUP: { self: "este grupo", contents: "los grupos que contiene" },
  MINISTRY: { self: "este ministerio", contents: "los grupos que contiene" },
};

const nodePermissionLabels: Record<
  string,
  (type: NodeType) => string | undefined
> = {
  "org.read": (type) =>
    `Ver los datos de ${scopes[type].self} y de ${scopes[type].contents}`,
  "org.update": (type) =>
    `Editar nombre, dirección, teléfono y redes de ${scopes[type].self} y de ${scopes[type].contents}`,
  "org.create_child": (type) =>
    ({
      CHURCH: "Crear sedes, grupos y ministerios",
      LOCATION: "Crear grupos y ministerios",
      GROUP: "Crear grupos dentro de este grupo",
      MINISTRY: "Crear grupos dentro de este ministerio",
    })[type],
  // Churches and locations cannot be deleted: only what hangs from them.
  "org.delete": (type) =>
    type === "GROUP" || type === "MINISTRY"
      ? `Eliminar ${scopes[type].self} y ${scopes[type].contents}`
      : "Eliminar grupos y ministerios",
};

export const resourceLabel = (resource: string) =>
  resourceLabels[resource] ?? resource;

/** Label of a permission; pass the node type to word it for that node. */
export const permissionLabel = (permission: string, type?: NodeType) =>
  (type ? nodePermissionLabels[permission]?.(type) : undefined) ??
  permissionLabels[permission] ??
  permission;

/** How far a role granted on a node of this type reaches. */
export const reachLabel = (type: NodeType) =>
  `Estos permisos valen para ${scopes[type].self} y para ${scopes[type].contents}.`;
