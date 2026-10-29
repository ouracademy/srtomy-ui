# Implementation Plan: Editar eventos y cursos (UI)

**Spec**: [spec.md](./spec.md)

## Diseño

1. **Contrato**: `app/(api)/openapi/srtomy-api.json` actualizado (`EditEventResponse`; `pnpm api:sync` también trajo `positions` ya no requerido en `CreateChurchRequest`, un cambio del API en `main`). `putEventsById` ya existía.
2. **Lógica pura** (`attendance/eventChange.ts`): `describeChange` (fecha/hora, día, repetición), `impactMessages` (qué decirle al usuario antes) y `toEditRequest` (el cuerpo del `PUT`), con `atTimeOf` para combinar fecha y hora.
3. **`EditEventDialog`**: opciones de serie + avisos + `SaveButton` con spinner.
4. **`EditableEventForm`**: arma los valores iniciales del evento (antes en `page.tsx`), valida «dejar de repetir», decide si hace falta el diálogo, llama a `putEventsById` y avisa el resultado.
5. **`EventForm`**: `lockType` (bloquea Evento/Curso) y un `fieldset` deshabilitado cuando `editable` es falso. `ToggleButton` gana `disabled`.
6. **`page.tsx`**: botón «Editar» (`events.write`), estado `editing`, `mutate` del evento al guardar.

## Constitution Check

| Principio       | Cómo                                                                           |
| --------------- | ------------------------------------------------------------------------------ |
| Pruebas         | Unitarias de cada archivo nuevo o cambiado; e2e en `tests/event-edit.spec.ts`. |
| Botones con API | `SaveButton` con `loading` en el formulario y en el diálogo.                   |
| Idioma          | Código en inglés, textos en español.                                           |
