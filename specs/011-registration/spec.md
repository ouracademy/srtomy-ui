# Feature Specification: Inscripción a eventos y cursos (UI)

**Feature Branch**: `claude/tender-ritchie-fu1afp`

**Created**: 2026-10-27

**Status**: Implementado. Incluye asistencia por QR (decisiones 7 a 9).

**Input**: Lo construido en la 007 se juzgó mal: el diálogo Compartir guarda solo, tiene un select con una única opción y la inscripción es un rol del enlace. Contrato y reglas: spec del API (`srtomy-api/specs/011-registration/`).

## Decisiones

1. **Compartir**: «Acceso general» (Restringido / Toda la iglesia / Cualquiera con el enlace) y se **quita** el select «Con el enlace» (`linkRole`). Se mantiene el rol Lector/Editor por persona.
2. **Guardar explícito**: el diálogo no guarda al cambiar nada. Acumula cambios (personas agregadas/quitadas, acceso general); **Guardar** está deshabilitado hasta que haya cambios, muestra spinner y bloquea mientras dura (skill `api-submit-button`, `primaryButtonSx`). «Cerrar» con cambios sin guardar pide confirmar. «Copiar enlace» y «Crear un enlace nuevo» siguen siendo acciones inmediatas, rotuladas como tales.
3. **Inscripción es otro proceso**: en `EventForm` (crear y editar) una sección «Inscripción» con tres modos: **Sin inscripción** (por defecto), **Gratis** (cupo total opcional) y **Con tipos de ticket** (nombre, precio, cantidad, ventana de venta), más: abierta/cerrada, exige cuenta, lista de espera. El precio es informativo (no se cobra).
4. **Pestaña «Inscritos»** del diálogo pasa a la pantalla del evento (`attendance`): lista con ticket e ingreso, quitar, y cupos usados por ticket.
5. **Página pública** `/e/[slug]`: elige ticket, llena nombre, apellido, correo y teléfono; muestra «Se agotaron los lugares» o cerrado; tras inscribirse muestra el resultado y el enlace para cancelar (`/e/[slug]/cancelar?codigo=…` o botón con el código).
6. **Mi espacio** (`/portal/me`), en palabras llanas:
   - **Mis eventos y cursos**: «Tengo lugar» (inscripción confirmada, con ticket y botón _Cancelar inscripción_) y «Asistí» (por asistencia). Cada tarjeta dice por qué aparece.
   - **Compartidos contigo**: eventos que alguien te dejó ver por correo y que aún no son tuyos por inscripción ni asistencia. Cada tarjeta dice quién/qué rol.

7. **El visitante es una persona con estado**: al registrar a alguien (en Personas y en la asistencia) se elige su estado, **Visitante**, **Asistente** o **Miembro**; con un cargo es Miembro y no se puede bajar. La pantalla de asistencia marca personas, inscritos (con su ticket) y permite «Agregar visitante» (solo el nombre es obligatorio; teléfono y correo, opcionales). Además hay un contador «Visitantes sin nombre» para quien no quiere dar su nombre o se le pasó al ujier anotarlo. Un culto sin inscripción solo usa personas y visitantes.
8. **QR del evento**: el ujier abre «Mostrar QR de asistencia» (pantalla completa, se renueva solo cada 5 minutos) y pide a la gente que lo escanee. Ruta pública `/a/[token]`: con sesión, «Marcar mi asistencia» (y su ticket, si tiene); sin sesión, un nombre opcional: con nombre queda como visitante, «Entrar sin nombre» suma al contador. Resultado claro: marcado, ya estaba marcado, venció.
9. **QR del ticket**: se dibuja en la confirmación de la inscripción y en la tarjeta de Mi espacio (con _ticketCode_). El ujier usa «Escanear tickets» (cámara del teléfono, con campo para escribir el código como alternativa accesible) y ve el resultado de cada lectura: nombre, ticket, «ingresó» o «ya había ingresado a las HH:MM». La lista de inscritos muestra quién ingresó y permite marcar a mano. Son los dos flujos de Eventbrite y Meetup: el organizador escanea el ticket, o el asistente escanea el QR del evento.
10. **Formulario de inscripción simple.** Un interruptor «Pedir inscripción» (apagado: cualquiera puede venir, sin anotarse). Encendido: solo **Cupos** («Vacío es sin límite.») y **Precio** («Vacío es gratis.»), que son los del ticket «General», un nombre que la pantalla no muestra. «Agregar otro tipo de ticket» abre la **lista de tickets**: cada uno con nombre, precio, cupos y, plegadas, sus fechas de venta; cada grupo se llama «Ticket N» para quien usa lector de pantalla, pero las etiquetas visibles no repiten el número. Al quitar tickets hasta que solo quede «General» (acción del usuario, no al escribir el nombre) vuelve al formulario corto: no hay un modo del que no se pueda salir. En «Más opciones», cerrado: «Solo con cuenta» y, en el formulario corto, «Venta desde» y «Venta hasta». Se quitan «Gratis / Sin inscripción / Con tipos de ticket», el cupo total, la lista de espera y «Inscripción abierta». Los errores dicen «Inscripción:» con un solo ticket y «Ticket N:» con varios. La pantalla no repite que el precio es informativo.
11. **Cerrar y reabrir** es un botón del panel de inscritos («Cerrar inscripciones» / «Reabrir inscripciones»), con spinner mientras responde el API, no un campo del formulario.
12. **Un permiso por acción.** El panel se muestra con `registrations.read`; «Configurar» con `registrations.configure`, cerrar y reabrir con `registrations.close`, «Quitar» con `registrations.remove` y marcar el ingreso con `attendance.write`. Al crear un evento la sección «Inscripción» solo aparece con `registrations.configure`.
13. **Sin lista de espera.** Se quitó del todo (API `V1.14.0`): al llenarse la página dice «Se agotaron los lugares» y no muestra el formulario; el panel de inscritos ya no tiene la columna «Estado» ni «En espera»; Mi espacio solo tiene lugares confirmados.
14. **Errores al cargar.** Si el API no puede dar la inscripción o el QR del evento, la pantalla lo dice con «Reintentar» (no se queda cargando) y no reintenta sola.

## User Scenarios & Testing

- **US1** Compartir: cambiar el acceso general no llama al API hasta pulsar Guardar; Guardar queda deshabilitado sin cambios; el select de rol del enlace no existe.
- **US2** Configurar la inscripción al crear un curso con solo cupos y precio, o con un segundo tipo de ticket; cerrar y reabrir con su botón; cada acción solo a quien tiene su permiso; editar y pasar a «Sin inscripción» con inscritos muestra el error del API.
- **US3** Inscribirse en la página pública: ticket, datos, resultado (confirmado / agotado / cerrado / exige cuenta).
- **US4** Los organizadores ven y quitan inscritos con su ticket y estado.
- **US5** Mi espacio muestra las dos secciones con el motivo de cada tarjeta y permite cancelar.
- **US6** Culto sin inscripción: marcar personas, agregar un visitante (queda con estado Visitante), sumar visitantes sin nombre, y ver el estado en Personas.
- **US7** `/a/[token]`: marcar con sesión, sin sesión con nombre (visitante) y sin nombre (contador), token vencido, ya marcado.
- **US8** Escanear un ticket: ingresó, ya había ingresado, no confirmada; alternativa de escribir el código; el QR del ticket se ve en la confirmación y en Mi espacio.
- **Accesibilidad**: axe sin violaciones serias en la página pública con inscripción, el diálogo Compartir y la sección Inscripción.

## Fuera de alcance

Pagos reales, correo de confirmación, preguntas propias, varios boletos por compra (deuda técnica `docs/redesign.md` §10).
