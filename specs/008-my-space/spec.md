# Feature Specification: Mi espacio (UI)

**Feature Branch**: `claude/008-my-space`

**Created**: 2026-10-25

**Status**: Implemented

**Input**: Fase 008 del rediseño ([`docs/redesign.md`](../../docs/redesign.md) §4.6 y §9; deuda técnica 9). Contrato y reglas en la spec del API: `srtomy-api/specs/008-my-space/`. Depende de la 005 (invitaciones), la 006 (directorio) y la 007 (compartidos).

## User Scenarios & Testing

### US1 — Después de entrar se llega a Mi espacio (P1)

1. **Given** alguien con acceso a algún nodo, **When** abre `/portal` (por ejemplo tras iniciar sesión), **Then** va a `/portal/me`, sea miembro sin cargo o administrador; desde ahí abre su sede, grupo o ministerio.
2. **Given** alguien sin iglesia, **Then** sigue viendo el asistente «Crea tu iglesia».
3. Aceptar una invitación vuelve a `/portal`, que lo lleva a Mi espacio con el árbol ya actualizado.
4. `/portal?nueva=1` sigue mostrando el formulario para registrar otra iglesia.

### US2 — La página `/portal/me` (P1)

Abierta a cualquier usuario con sesión, con estas secciones (cada una carga y falla por su cuenta). El directorio de la iglesia **no** va aquí: sigue en «Directorio» del menú de cada nodo.

1. **Mis eventos y cursos** (`GET /me/events`): título (enlace a `/e/{slug}`), si es curso, el nodo, la fecha y las marcas «Inscrito» y «Asististe».
2. **Mis grupos y ministerios** (`GET /me/nodes`): enlace al nodo, tipo e iglesia, «Líder» y los cargos que tiene allí.
3. **Compartidos contigo** (`GET /me/shared-events`) e **Invitaciones** (`GET /me/invitations`, con «Aceptar»). En Mi espacio siempre se muestran, con un texto si están vacías.
4. «Registrar otra iglesia».

### US3 — Un miembro no ve administración (P1)

En el menú de un nodo, «Cargos y accesos» solo sale con `members.read`, `positions.manage`, `iam.read`, `iam.manage` o `invitations.send`, y el Dashboard con `members.read`; «Personas» ya pedía `members.read`. Todos ven «Mi espacio». La UI solo oculta: la API autoriza.

## Fuera de alcance

La edición del perfil propio y el resto de deuda técnica de `docs/redesign.md` §10.
