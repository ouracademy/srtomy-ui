# Feature Specification: Pestaña "Accesos" y roles personalizados

**Feature Branch**: `claude/004-access-management`

**Created**: 2026-10-24

**Status**: Implemented

**Input**: Fase 004 del rediseño ([`docs/redesign.md`](../../docs/redesign.md)). Contrato y reglas en la spec del API: `ovejafiel-api/specs/004-access-management/`. Depende de la 003 y del PR del API de esta fase.

## User Scenarios & Testing

### US1 — Ver y administrar los accesos de un nodo (P1)

Quien tiene `iam.read` ve "Accesos" en el menú de cualquier nodo: una tabla con correo, rol y origen ("Directo" o "Heredado de {nodo}"). Quien tiene `iam.manage` puede además otorgar un rol escribiendo el correo y eligiendo el rol, y quitar los accesos directos (con confirmación). Los heredados no tienen botón de quitar.

1. **Given** un usuario con `iam.read`, **When** abre Accesos, **Then** ve los accesos directos y heredados.
2. **Given** un usuario sin `iam.read`, **When** mira el menú, **Then** no aparece "Accesos".
3. **Given** un usuario con `iam.manage`, **When** otorga un rol, **Then** se envía `POST /v1/organizations/{id}/access` y la lista se actualiza. Si la API rechaza (403, usuario inexistente...), se muestra su mensaje.
4. **Given** un usuario sin `iam.manage`, **When** abre Accesos, **Then** ve la tabla sin formulario ni botones de quitar.

### US2 — Roles personalizados de la iglesia (P2)

Desde "Administrar roles" se listan los roles predefinidos (sin editar) y los propios. "Nuevo rol" abre un diálogo con nombre, descripción, "Crear a partir de" (desde cero o un rol predefinido) y los permisos agrupados por recurso, con un casillero por grupo. Se puede editar y eliminar (con confirmación) los roles propios.

1. **Given** el diálogo de nuevo rol, **When** se elige un rol predefinido, **Then** se marcan sus permisos y se pueden ajustar.
2. **Given** que no hay nombre o permisos, **Then** "Guardar" está deshabilitado.
3. **Given** un error de la API (nombre repetido, permisos que no tiene), **Then** se muestra el mensaje y el diálogo sigue abierto.

## Requirements

- **FR-001**: Todos los botones que llaman a la API muestran spinner y se bloquean mientras dura la petición.
- **FR-002**: La UI solo oculta controles según permisos; la API sigue siendo la autoridad.
- **FR-003**: Los nombres de permisos se muestran en español; uno desconocido se muestra tal cual.
