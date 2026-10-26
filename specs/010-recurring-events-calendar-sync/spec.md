# Feature Specification: Eventos recurrentes y calendario suscribible (UI)

**Feature Branch**: `claude/recurring-events-calendar-sync-mmefu3`

**Status**: Implemented

**Input**: La especificación completa y las decisiones están en srtomy-api: `specs/010-recurring-events-calendar-sync/spec.md`. Este documento solo recoge lo que cambia en la interfaz.

## Decisiones

1. **Repetir como en Google Calendar**: el bloque «Se repite» del formulario de eventos (`RecurrenceFields`) pasa de «casilla + días + fecha de fin obligatoria» a: frecuencia (no se repite, diaria, semanal, mensual, anual), «Cada N» días/semanas/meses/años, días de la semana (semanal), «Día N del mes» o «el n-ésimo día de la semana» (mensual) y «Termina»: nunca, el (fecha) o después de N repeticiones. Una frase resume la regla («Semanalmente el lunes y miércoles, hasta el 14 de enero de 2026»).
2. **Lógica pura aparte**: `app/(components)/recurrence.ts` tiene el esquema zod, `describeRecurrence`, `toRecurrenceRequest` (formulario → cuerpo de `POST /events`) y `fromRecurrenceResponse` (respuesta → formulario). El formulario de un evento existente (asistencia) es de solo lectura y muestra la frase.
3. **Zona horaria**: la página de eventos envía la del navegador (`Intl.DateTimeFormat().resolvedOptions().timeZone`) para que la hora local de la serie se mantenga con el horario de verano (deuda 20 de srtomy-api: zona por organización).
4. **Sincronizar con el calendario**: en `/portal/profile`, `CalendarSyncCard` muestra el enlace privado `.ics` del usuario (`GET /me/calendar-feed`), botones «Agregar a Google Calendar» y «Agregar a Apple Calendar» (`webcal://`), «Copiar enlace» y «Generar un enlace nuevo» (`POST /me/calendar-feed/renew`, con confirmación, revoca el anterior). Es solo lectura y Google puede tardar hasta un día en reflejar cambios.
5. La especificación OpenAPI (`app/(api)/openapi/srtomy-api.json`) se resincronizó con la API de la rama `claude/recurring-events-calendar-sync-mmefu3`; tras sincronizar con `main`, el diff solo trae lo de esta fase.

6. **Compartir**: cada ocurrencia es un evento propio, así que «Compartir» desde la página de asistencia comparte esa fecha (antes compartía la serie entera). La página pública `/e/{slug}` describe la repetición con `describeRecurrence` (deuda 18 de srtomy-api: compartir la serie completa).

## Tasks

- [x] T001 Resincronizar la especificación OpenAPI y regenerar el cliente.
- [x] T002 `recurrence.ts` con su prueba; `RecurrenceFields` y `EventForm` con la regla nueva.
- [x] T003 Página de eventos y de asistencia: enviar/leer `recurrence`.
- [x] T004 `CalendarSyncCard` y `calendarFeed.ts` en el perfil.
- [x] T005 Pruebas unitarias y e2e (`tests/event-recurrence.spec.ts`).
