# Implementation Plan: Inscripción a eventos y cursos (UI)

**Spec**: [spec.md](./spec.md). Depende del API (`pnpm api:sync` + `pnpm api:generate` con el contrato nuevo).

## Diseño

1. **Contrato**: regenerar `app/(api)/openapi/srtomy-api.json` (con el API corriendo; sin Docker, con un `SpringBootTest` temporal que baja `/v3/api-docs`) y `pnpm api:generate`.
2. **Servicios** (`app/(api)/services`): `eventRegistration` (leer/guardar/quitar la configuración, inscritos, quitar inscrito, cancelar por código) y ajustes a `eventSharing` (sin `linkRole`) y a la página pública.
3. **`eventSharing.ts`**: quitar `linkRole*`, `linkRolesFor` y ajustar `accessSummary`.
4. **`ShareEventDialog`**: estado local de borrador (personas por agregar/quitar, acceso general), `isDirty`, botón **Guardar** con `LoadingButton` + `primaryButtonSx`; el contenedor (`ShareEventButton`) aplica el borrador con los endpoints existentes y reporta errores sin perder lo escrito. Se quita la pestaña «Inscritos».
5. **`RegistrationFields`** (junto a `EventForm`): sección «Inscripción» con react-hook-form + zod (tickets dinámicos); `EventForm` la envía tras guardar el evento.
6. **Inscritos** en la pantalla `attendance`: tabla con ticket, estado y cupos.
7. **`app/e/[slug]`**: formulario con selección de ticket y estados; pantalla de cancelación.
8. **`app/portal/me`**: `MyEvents` con «Tengo lugar» / «Asistí» y cancelar; `Compartidos contigo` excluye lo que ya es mío; textos nuevos.
9. **Asistencia por QR**: `AttendanceQrDialog` (QR del evento con renovación), página pública `app/a/[token]`, `TicketQr` (dibuja el QR del ticket en el cliente), `TicketScanner` (cámara con `BarcodeDetector` y respaldo manual; la librería se elige al implementar) y la lista de asistencia con inscritos, visitantes y contador. Servicios nuevos en `app/(api)/services/attendance`.
10. **Pruebas**: unitarias con user-event y `@/app/(api)/generated` simulado; e2e (`tests/sharing.spec.ts`, `tests/course-reg.spec.ts`, `tests/event-registration.spec.ts`, `tests/my-space.spec.ts`) y axe en `tests/a11y.spec.ts`.
11. **Docs**: `docs/redesign.md` §7 y deuda técnica; `docs/architecture.md`.

## Constitution Check

Código y comentarios en inglés, textos en español, pruebas junto al código, `pnpm check:fast` en verde, sin debilitar chequeos.
