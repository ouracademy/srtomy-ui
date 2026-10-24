# Feature Specification: Invitaciones (UI)

**Feature Branch**: `ccr-76a49388-8zpdqw`

**Created**: 2026-10-24

**Status**: Implemented

**Input**: Fase 005 del rediseño ([`docs/redesign.md`](../../docs/redesign.md) §5). Contrato y reglas en la spec del API: `srtomy-api/specs/005-invitations/`. Depende de la 004b.

## User Scenarios & Testing

### US1 — Invitar por correo con un cargo (P1)

En «Cargos y accesos», quien tiene `invitations.send` ve la pestaña **Invitaciones**: un formulario (correo, nombre, apellido y cargo opcional) y la tabla de pendientes (correo, persona, cargo, vencimiento; las vencidas con la etiqueta «Vencida»).

1. **Given** el formulario completo, **When** se envía, **Then** `POST /organizations/{id}/invitations`, aparece «Invitación enviada» y la fila en la tabla. El cargo «Sin cargo» solo vincula la cuenta.
2. **Given** que el correo no se pudo enviar (`emailSent=false`), **Then** se avisa que la invitación se guardó y que se intente de nuevo.
3. **Given** un rechazo de la API (403: el cargo da permisos que el usuario no tiene), **Then** se muestra el mensaje de la API y el formulario conserva lo escrito.
4. **Given** una fila, **When** se pulsa «Cancelar» y se confirma, **Then** `DELETE /invitations/{id}`.
5. **Given** un usuario sin `invitations.send`, **Then** no ve la pestaña.

### US2 — Aceptar el enlace (P1)

`/invitacion/{token}` es pública: muestra dónde y con qué cargo lo invitan y a qué correo.

1. **Given** una visita sin sesión, **When** pulsa «Iniciar sesión o crear cuenta», **Then** va a Auth0 con el correo sugerido (`login_hint`) y vuelve a la misma página (`appState.returnTo`).
2. **Given** una sesión iniciada y la cuenta ya registrada en la API, **When** pulsa «Aceptar invitación», **Then** `POST /invitations/{token}/accept`, se recuerda el nodo y entra a `/portal/{nodo}`.
3. **Given** otro correo o sin verificar, **Then** se muestra el mensaje de la API y «Usar otra cuenta» cierra la sesión.
4. **Given** una invitación vencida, cancelada o ya aceptada, **Then** se dice y no hay botón.

### US3 — «Tienes invitaciones» (P2)

En `/portal`, quien tiene invitaciones para su correo verificado las ve con «Aceptar» (`POST /me/invitations/{id}/accept`), junto al alta de iglesia.

### US4 — Invitar líderes (P2)

En el formulario de grupo o ministerio, al elegir líderes **con correo** aparece la casilla «Invitar a usar la app…» (marcada). Al guardar, se invita a cada uno por su persona; el aviso resume cuántos se invitaron y por qué falló alguno.

### US5 — Correo de la persona (P2)

El formulario de persona tiene «Correo electrónico» (opcional, validado); lo usan las invitaciones a líderes.

## Requirements

- **FR-001**: Todo botón que llama a la API muestra spinner y se bloquea mientras dura la petición.
- **FR-002**: La UI solo oculta controles según permisos (`invitations.send`); la API es la autoridad.
- **FR-003**: Tras iniciar sesión solo se vuelve a rutas del propio sitio (`returnToFrom`).
- **FR-004**: La UI nunca muestra ni guarda el token fuera de la URL del enlace.

## Assumptions

- Un líder ya guardado no trae correo en la lista de miembros del API, así que al **editar** un grupo solo se invita a los líderes elegidos en esa sesión (deuda 15).
