# Roadmap: lo que falta frente al benchmark

Sale del benchmark de apps para iglesias (v3, 8 de noviembre de 2026): las filas del roadmap que nuestra app aún no tiene. Cada módulo tiene su plan corto y el texto para abrir **una sesión por módulo**. El chatbot y WhatsApp no están aquí: ya los cubre `specs/017-ai-assistant-chat/`.

**Orden sugerido**: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9. Planes y pagos va primero porque los demás módulos se protegen con él.

| #   | Módulo                                              | Plan Gratis | Esfuerzo    | Depende de               | Estado                                                             |
| --- | --------------------------------------------------- | ----------- | ----------- | ------------------------ | ------------------------------------------------------------------ |
| 1   | Planes, pagos y límites de uso                      | —           | 2–3 semanas | —                        | **En curso**: spec `018-plans-billing` en srtomy-api, fase 1 hecha |
| 2   | Exportar a Excel                                    | No          | Días        | 1                        | Por hacer                                                          |
| 3   | Familias y hogares                                  | Sí          | 1–2 semanas | —                        | Por hacer                                                          |
| 4   | Ofrendas por culto, estado de cuenta y recibo anual | No          | 2–3 semanas | 1                        | Por hacer                                                          |
| 5   | Correos a grupos de personas                        | No          | 1–2 semanas | 1                        | Por hacer                                                          |
| 6   | Turnos y voluntarios, con fechas bloqueadas         | No          | Un mes      | 1                        | Por hacer                                                          |
| 7   | Seguimiento de visitas y resumen semanal            | No          | 2 semanas   | 1, 5, outbox de WhatsApp | Por hacer                                                          |
| 8   | Notificaciones en el portal (campana)               | Sí          | 1–2 semanas | —                        | Por hacer                                                          |
| 9   | Semáforo de salud de células                        | Sí          | 1 semana    | —                        | Por hacer                                                          |

Quedan fuera por ahora (el benchmark los marca «Después»): cobro online de la inscripción a eventos (usará dLocal Go del módulo 1), contabilidad completa, cursos con progreso y certificado, check-in infantil y API pública.

## Reglas para todas las sesiones

- Lee el `AGENTS.md` de srtomy-api y de srtomy-ui. Spec-kit (`speckit-specify`, `speckit-plan`, `speckit-tasks`) en `specs/<NNN-nombre>/` de srtomy-api, con el número libre siguiente.
- **Cada spec trae su `quickstart.md`**: cómo se usa la función, para la iglesia y para quien programa.
- Si la función es de un plan de pago (Básico, Iglesia o Red), protégela en la API con `CheckFeatureQueryHandler` (`billing.domain.Feature`), que responde 402 con `code`. Si el módulo 1 aún no está en `main`, parte de su rama `claude/church-features-pricing-plan-masj76`.
- Envíos (correo, WhatsApp) siempre por el **outbox** y trabajo en calendario con **Cloud Scheduler**, nunca `@Scheduled`.
- Las tablas grandes del portal usan MUI X DataGrid; las llamadas, `app/(api)/services`.
- Un permiso nuevo va en `iam.domain.Permission`, en una migración para los roles predefinidos y en `app/(components)/permissionLabels.ts`.
- Pregunta al dueño del producto lo que la spec deje abierto; no lo cierres solo.

Texto para abrir la sesión de un módulo (reemplaza `N` y pega su sección):

> Implementa el módulo N de `docs/roadmap.md` de srtomy-ui, siguiendo sus «Reglas para todas las sesiones». Empieza con la spec (spec-kit) y el plan; luego implementa en srtomy-api y srtomy-ui con pruebas. Termina con las verificaciones en verde y una rama por repo, sin PR.

## 1. Planes, pagos y límites de uso

Ver `specs/018-plans-billing/` en srtomy-api (spec, plan, investigación y guía). Tiene su propia sesión abierta: «Planes, pagos y límites de uso (spec 018)».

## 2. Exportar a Excel

**Para qué**: llevar listas e informes fuera del sistema; facilita que una iglesia llegue desde otra app. Cinco de catorce competidores lo tienen.

**Plan**

- API: `GET /v1/organizations/{id}/people/export`, `.../events/{eventId}/attendance/export` y `.../dashboard/export`, con los mismos filtros que las listas, respondiendo `.xlsx` (Apache POI, en streaming para listas grandes). Mismos permisos que la lista (`members.read`, `events.read`) y `Feature.EXCEL_EXPORT`.
- Portal: botón «Exportar a Excel» en Personas, Asistencia y Dashboard; en el plan Gratis el botón lleva a «Plan y pagos».
- Respeta la visibilidad de miembros (spec 006): no exportes lo que la persona no puede ver.

**Cómo usarlo**: en cualquier lista, aplicar los filtros y pulsar «Exportar a Excel».

## 3. Familias y hogares

**Para qué**: ver padres e hijos juntos y escribir una sola vez a la familia. Lo tienen todas las apps grandes.

**Plan**

- API (módulo `person` o uno nuevo `household`): entidad `Household` (nombre, dirección, teléfono) con miembros y su rol (cabeza, cónyuge, hijo, otro). Crear, unir a una persona, quitarla. Una persona en un solo hogar. Permisos `members.read` y `members.write`.
- Al crear una persona, ofrecer «agregar a un hogar» y usar el aviso de duplicados que ya existe.
- Portal: sección «Familia» en la ficha de la persona y filtro «por hogar» en Personas.
- Los correos (módulo 5) podrán enviar «uno por hogar».

**Cómo usarlo**: en la ficha de una persona, «Familia» → «Crear hogar» o «Unir a un hogar».

## 4. Ofrendas por culto, estado de cuenta y recibo anual

**Para qué**: llevar el efectivo, Yape y las transferencias de cada servicio sin pasarela, y entregar a cada persona lo que aportó. Es la base de las finanzas, hoy en 0 % del benchmark.

**Plan**

- API (módulo nuevo `finance`): `Fund` (diezmo, ofrenda, misiones, construcción…), `Contribution` (fecha, monto, moneda, medio: efectivo, Yape, Plin, transferencia, tarjeta; fondo; persona opcional; evento o culto opcional; nota) y `CollectionBatch` (lo recogido en un culto, con quién contó y cuadre). Permisos nuevos `finances.read` y `finances.write`, y un rol predefinido «Tesorería». `Feature.FINANCES`.
- Estado de cuenta por persona y año en PDF (OpenPDF o similar), y envío del recibo anual por correo por el outbox.
- Portal: «Finanzas» con el registro por culto (carga rápida en fila), totales por fondo y por mes, ficha de aportes en la persona y el PDF.
- Los datos de aportes son sensibles: solo quien tiene `finances.read` los ve, también en el dashboard y en el asistente.

**Cómo usarlo**: después del culto, «Finanzas» → «Nuevo registro» → montos por medio y fondo; en enero, «Recibos anuales» → enviar.

## 5. Correos a grupos de personas

**Para qué**: escribir a todos los de una sede, un grupo o un estado (visitantes, miembros). Lo tienen seis de catorce.

**Plan**

- API (módulo `notification` o `messaging`): `Broadcast` con asunto, texto, segmento (nodos, estados, «uno por hogar» cuando exista el módulo 3) y estado; al enviar, una fila del outbox por destinatario con `dispatchNow = false` y el barrido existente. Permiso `messages.send`. `Feature.MASS_EMAIL`.
- Baja de correos: enlace firmado para dejar de recibir (y respetarlo en todo envío masivo).
- Portal: «Mensajes» → redactar, ver a cuántos llega antes de enviar, historial con enviados y fallidos (el outbox ya da los estados).
- Límite diario por iglesia para cuidar la reputación del dominio de Resend.

**Cómo usarlo**: «Mensajes» → «Nuevo correo» → elegir destinatarios → revisar el total → «Enviar».

## 6. Turnos y voluntarios, con fechas bloqueadas

**Para qué**: decidir quién sirve cuándo y que cada uno acepte o rechace. Planning Center es el referente; cuatro de catorce lo tienen.

**Plan**

- API (módulo nuevo `serving`): `Team` (alabanza, sonido, bienvenida, niños) colgado de un nodo; `Position` del equipo con cupo; `Shift` = evento (o sesión) + posición + persona + estado (`PENDING`, `ACCEPTED`, `DECLINED`); `Blockout` = persona + rango de fechas. Aviso si se programa a alguien en una fecha bloqueada o en dos turnos a la vez. Invitación y recordatorio por correo (y luego WhatsApp) por el outbox. `Feature.VOLUNTEERS`.
- Portal: en el evento, pestaña «Equipo» con la grilla por posición; para el voluntario, en «Mi espacio», «Mis turnos» con aceptar o rechazar y sus fechas bloqueadas.
- Luego: el agente pregunta «¿puedes servir el domingo 15?» (fila 11 del benchmark).

**Cómo usarlo**: el líder abre el evento → «Equipo» → asigna personas; cada voluntario confirma desde «Mi espacio».

## 7. Seguimiento de visitas y resumen semanal

**Para qué**: que nadie olvide dar la bienvenida. Una visita nueva recibe mensajes a los 3, 7 y 30 días; los pastores reciben cada lunes un resumen con asistencia, visitas nuevas y alertas.

**Plan**

- API: `FollowUpCadence` por iglesia (pasos con día relativo, canal y plantilla) que se dispara al registrar a un visitante (estados de persona, spec 012); un job diario de Cloud Scheduler encola los pasos del día por el outbox. Tareas para un líder («llamar a Ana») cuando la iglesia no quiere envío automático. Resumen semanal con los datos del dashboard.
- WhatsApp necesita plantillas aprobadas por Meta y el manejador del outbox de WhatsApp; empieza por correo y suma WhatsApp cuando esté.
- Portal: «Seguimiento» con la cadencia editable, las visitas en curso y en qué paso va cada una.

**Cómo usarlo**: «Seguimiento» → activar la cadencia → cada visitante nuevo entra solo.

## 8. Notificaciones en el portal (campana)

**Para qué**: avisos dentro de la app: invitación aceptada, evento compartido contigo, turno asignado, plan por vencer.

**Plan**

- API: `Notification` por usuario (tipo, texto, enlace, leída) creada por los módulos que ya avisan por correo (en la misma transacción); `GET /v1/me/notifications` y marcar como leídas.
- Portal: campana en la barra con contador, lista y «marcar todo como leído», con SWR y refresco al volver a la pestaña.

**Cómo usarlo**: la campana muestra lo nuevo; un clic lleva a lo que pasó.

## 9. Semáforo de salud de células

**Para qué**: ver de un vistazo qué grupos están sanos, en riesgo o inactivos. Típico de iglesias celulares.

**Plan**

- API: indicador por grupo calculado de la asistencia y el crecimiento que ya existen: verde si se reunió en las últimas dos semanas y no bajó; ámbar si faltó una reunión o bajó la asistencia más de un 20 %; rojo con tres semanas sin reunirse. Umbrales configurables por iglesia.
- Portal: color en la lista de grupos y en el ranking del dashboard, con la razón al pasar el mouse.

**Cómo usarlo**: «Grupos» muestra el color de cada uno; el dashboard ordena los que necesitan atención primero.
