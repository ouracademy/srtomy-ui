# Feature Specification: Alta de iglesia, cambio de contexto y permisos en la UI

**Feature Branch**: `claude/app-flow-redesign-nq6j60`

**Created**: 2026-10-24

**Status**: Implemented

**Input**: Fase 1 (003) del rediseño ([`docs/redesign.md`](../../docs/redesign.md)). El contrato y las reglas de acceso están en la spec del API: `ovejafiel-api/specs/003-identity-iam/`.

## User Scenarios & Testing

### US1 — Crear mi iglesia con su primera sede (P1)

Un usuario sin iglesias entra a `/portal` y ve "Bienvenido" con un formulario de tres partes:

1. La iglesia, con sus redes en "Otras opciones".
2. La primera sede, obligatoria.
3. Los cargos sugeridos (Pastor, Líder de alabanza, Servidor y Maestro), que puede quitar o reemplazar escribiendo otros.

Al guardar entra a la nueva sede.

1. **Given** un usuario sin iglesias, **When** completa el formulario y guarda, **Then** se envía `POST /v1/organizations` con la sede y los cargos, y navega a `/portal/{sede}`.
2. **Given** un usuario con iglesias, **When** abre `/portal`, **Then** entra al último nodo que usó o a su primera sede.
3. **Given** un usuario con iglesias, **When** elige "Registrar otra iglesia", **Then** ve el mismo formulario (`/portal?nueva=1`).

### US2 — Cambiar de iglesia, sede, grupo o ministerio (P1)

La barra superior muestra la ruta del nodo actual. Al pulsarla se abre un selector con buscador y todas sus iglesias en árbol. Los ancestros sin acceso aparecen deshabilitados. Cada grupo o ministerio es un nodo propio: su página edita sus datos y lista sus subgrupos.

### US3 — Ver solo lo que puedo hacer (P1)

El menú oculta Personas o Eventos sin `members.read` o `events.read`. Los formularios ocultan Guardar sin `org.update`. Crear y borrar hijos requieren `org.create_child` y `org.delete`. "Registrar sede" aparece solo con `org.create_child` en la iglesia.

### US4 — Cargos flexibles (P2)

Sección "Cargos": los cargos de la iglesia, que se pueden agregar (con autocompletado de sugerencias), renombrar y eliminar con `positions.manage`. En el formulario de persona, un cargo nuevo escrito a mano se crea al guardar.

## Requirements

- **FR-001**: La UI MUST obtener las iglesias del usuario de `GET /me/organizations`, nunca de un claim del token.
- **FR-002**: Crear una iglesia MUST exigir la primera sede.
- **FR-003**: Los enlaces sociales MUST ser opcionales y validarse como http(s).
- **FR-004**: La UI MUST ocultar acciones sin permiso. La API sigue siendo la autoridad.
- **FR-005**: Los cargos MUST aceptar cualquier nombre. Las sugerencias solo autocompletan.

## Success Criteria

- **SC-001**: Un usuario nuevo llega a su sede en un solo envío de formulario.
- **SC-002**: Las pruebas e2e cubren el alta de iglesia, el ingreso directo al último nodo y la edición sin permiso.
