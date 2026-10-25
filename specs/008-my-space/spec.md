# Feature Specification: Mi espacio (UI)

**Feature Branch**: `claude/008-my-space`

**Created**: 2026-10-25

**Status**: Implemented

**Input**: Fase 008 del rediseño ([`docs/redesign.md`](../../docs/redesign.md) §4.6 y §9; deuda técnica 9). Contrato y reglas en la spec del API: `srtomy-api/specs/008-my-space/`. Depende de la 005 (invitaciones), la 006 (directorio) y la 007 (compartidos).

## User Scenarios & Testing

### US1 — Un miembro sin cargo aterriza en Mi espacio (P1)

1. **Given** una persona vinculada a su usuario que solo tiene el nivel Miembro (`org.read`, `events.read`) en su nodo, **When** abre `/portal`, **Then** va a `/portal/me` en vez del nodo.
2. **Given** alguien con algún permiso más allá del nivel Miembro (p. ej. `members.read`, `attendance.write`), **Then** va al nodo como hasta ahora.
3. **Given** alguien sin iglesia, **Then** sigue viendo el asistente «Crea tu iglesia».
4. Aceptar una invitación vuelve a `/portal`, que decide el destino con los permisos del nodo.

### US2 — La página `/portal/me` (P1)

Abierta a cualquier usuario con sesión, con estas secciones (cada una carga y falla por su cuenta):

1. **Mis eventos y cursos** (`GET /me/events`): título (enlace a `/e/{slug}`), si es curso, el nodo, la fecha y las marcas «Inscrito» y «Asististe».
2. **Mis grupos y ministerios** (`GET /me/nodes`): enlace al nodo, tipo e iglesia, «Líder» y los cargos que tiene allí.
3. **Directorio**: el directorio de cada iglesia del usuario (el mismo componente que la pantalla Directorio, `ChurchDirectory`); cada nodo respeta su visibilidad.
4. **Compartidos contigo** (`GET /me/shared-events`) e **Invitaciones** (`GET /me/invitations`, con «Aceptar»). En Mi espacio siempre se muestran, con un texto si están vacías.
5. «Registrar otra iglesia».

### US3 — Un miembro no ve administración (P1)

En el menú de un nodo, «Cargos y accesos» solo sale con `members.read`, `positions.manage`, `iam.read`, `iam.manage` o `invitations.send`, y el Dashboard con `members.read`; «Personas» ya pedía `members.read`. Todos ven «Mi espacio». La UI solo oculta: la API autoriza.

## Fuera de alcance

La edición del perfil propio y el resto de deuda técnica de `docs/redesign.md` §10.
