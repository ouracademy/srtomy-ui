# Feature Specification: Editar eventos y cursos (UI)

**Feature Branch**: `edit-events`

**Created**: 2026-10-29

**Status**: Implementado

**Input**: El detalle de un evento (`attendance/page.tsx`) mostraba el `EventForm` en solo lectura porque el API no editaba (`PUT /events/{id}` era un TODO). Contrato y reglas: spec del API (`srtomy-api`, `specs/013-edit-events`).

## Decisiones

1. **Botón «Editar»** en el detalle, visible con el permiso `events.write`. Vuelve editable el formulario; **Guardar** (con spinner) y **Cancelar** (descarta) aparecen debajo. Mientras no se edita, el formulario no se puede escribir (un `fieldset` deshabilitado). El tipo (Evento o Curso) se muestra como valor, sin botones, porque no cambia.
2. **No se cambia el nodo ni el tipo**: la UI envía el nodo de la pantalla y muestra Evento/Curso como valor (`lockType`); si aun así el API responde 400, se muestra su explicación (`apiErrorMessage`).
3. **Evento de una serie**: al guardar se abre `EditEventDialog` con «Este evento», «Este y los eventos siguientes» y «Todos los eventos» (como `DeleteRecurrentEventDialog`, sin react-hook-form).
4. **Avisar antes**: el diálogo (o uno de confirmación, si el evento es suelto y cambió la fecha, la hora, el nombre, el lugar, los ponentes o la repetición) dice qué va a pasar: que quienes se inscribieron recibirán un correo si cambia la fecha, la hora, el nombre, el lugar o los ponentes; que si se cambia el día o cómo se repite, los eventos pasados o con inscritos o asistencia no cambian y quedan sueltos; que «Este evento» sale de la serie. Un evento suelto cuyo horario no cambió se guarda sin diálogo.
5. **Qué se envía**: siempre nombre, lugar, descripción, ponentes, nodo, tipo, inicio y fin (la fecha del formulario más la hora de cada selector) y la opción. La repetición solo si el evento no se repetía (puede empezar a hacerlo) o si el usuario la cambió y la opción alcanza a más de este evento; la zona horaria va con ella, y siempre en un evento suelto. Así un cambio de nombre en una serie no hace que el API regenere sus ocurrencias.
6. **Dejar de repetir**: «No se repite» en una serie no la detiene; la UI avisa que hay que eliminar «Este y los eventos siguientes» (deuda 30).
7. **Resultado**: el snackbar dice «Evento actualizado.», cuántas personas recibieron correo y cuántos eventos se conservaron.

## User Scenarios & Testing

1. **Given** un evento con permiso `events.write`, **When** se pulsa «Editar», cambia el título y se pulsa «Guardar», **Then** se envía `PUT /events/{id}` con `option: THIS_EVENT`, se muestra «Evento actualizado.» y el formulario vuelve a solo lectura.
2. **Given** un evento de una serie, **When** se guarda, **Then** se pregunta a cuáles aplicar el cambio y se envía la opción elegida, sin repetición si no se cambió.
3. **Given** que el API responde 400, **Then** se muestra su explicación y el formulario sigue editable.
4. **Given** que se pulsa «Cancelar», **Then** se descartan los cambios y no se llama al API.

## Requirements

- **FR-001**: el cliente se regenera del OpenAPI actualizado (`pnpm api:sync`); no hay llamadas HTTP a mano.
- **FR-002**: el botón de guardar muestra spinner y se bloquea mientras dura la petición (skill `api-submit-button`).
- **FR-003**: pruebas unitarias junto a cada archivo y e2e en `tests/event-edit.spec.ts`.
