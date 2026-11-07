# Implementation Plan: Eventos compuestos (UI)

Spec: [`spec.md`](./spec.md).

1. Sincronizar el OpenAPI con los campos de 012 y regenerar el cliente.
2. `eventRange` (día + horas) y `EndDateField` («Hasta») en `EventForm`; `selectionDefaults` para elegir días en el calendario; `calendarEvent` para la banda.
3. `EventForm` acepta `container` (rango del evento, sin repetición, cómo se inscribe) y `RegistrationModeField`.
4. Pantalla del evento: `ProgramSection`, `SubEventDialog`, `ContainerNotice`, aviso al borrar. `EditableEventForm` pasa el contenedor y el modo.
5. Página pública (`EventProgram`, `ParentEventNotice`, `eventWhen` de varios días) y Mi espacio.
6. e2e en `tests/composite-events.spec.ts` y accesibilidad de la página pública con programa.
