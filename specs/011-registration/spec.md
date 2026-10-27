# Feature Specification: Inscripción a eventos y cursos (UI)

**Feature Branch**: `claude/tender-ritchie-fu1afp`

**Created**: 2026-10-27

**Status**: Plan (sin implementar). Pendiente de visto bueno del dueño del producto.

**Input**: Lo construido en la 007 se juzgó mal: el diálogo Compartir guarda solo, tiene un select con una única opción y la inscripción es un rol del enlace. Contrato y reglas: spec del API (`srtomy-api/specs/011-registration/`).

## Decisiones

1. **Compartir**: «Acceso general» (Restringido / Toda la iglesia / Cualquiera con el enlace) y se **quita** el select «Con el enlace» (`linkRole`). Se mantiene el rol Lector/Editor por persona.
2. **Guardar explícito**: el diálogo no guarda al cambiar nada. Acumula cambios (personas agregadas/quitadas, acceso general); **Guardar** está deshabilitado hasta que haya cambios, muestra spinner y bloquea mientras dura (skill `api-submit-button`, `primaryButtonSx`). «Cerrar» con cambios sin guardar pide confirmar. «Copiar enlace» y «Crear un enlace nuevo» siguen siendo acciones inmediatas, rotuladas como tales.
3. **Inscripción es otro proceso**: en `EventForm` (crear y editar) una sección «Inscripción» con tres modos: **Sin inscripción** (por defecto), **Gratis** (cupo total opcional) y **Con tipos de ticket** (nombre, precio, cantidad, ventana de venta), más: abierta/cerrada, exige cuenta, lista de espera. El precio es informativo (no se cobra).
4. **Pestaña «Inscritos»** del diálogo pasa a la pantalla del evento (`attendance`): lista con ticket y estado (Confirmado/En espera), quitar, y cupos usados por ticket.
5. **Página pública** `/e/[slug]`: elige ticket, llena nombre, apellido, correo y teléfono; muestra agotado/lista de espera/cerrado; tras inscribirse muestra el resultado y el enlace para cancelar (`/e/[slug]/cancelar?codigo=…` o botón con el código).
6. **Mi espacio** (`/portal/me`), en palabras llanas:
   - **Mis eventos y cursos**: «Tengo lugar» (inscripción confirmada o en espera, con ticket, estado y botón _Cancelar inscripción_) y «Asistí» (por asistencia). Cada tarjeta dice por qué aparece.
   - **Compartidos contigo**: eventos que alguien te dejó ver por correo y que aún no son tuyos por inscripción ni asistencia. Cada tarjeta dice quién/qué rol.

## User Scenarios & Testing

- **US1** Compartir: cambiar el acceso general no llama al API hasta pulsar Guardar; Guardar queda deshabilitado sin cambios; el select de rol del enlace no existe.
- **US2** Configurar la inscripción al crear un curso con dos tickets; editar y pasar a «Sin inscripción» con inscritos muestra el error del API.
- **US3** Inscribirse en la página pública: ticket, datos, resultado (confirmado / en espera / agotado / cerrado / exige cuenta).
- **US4** Los organizadores ven y quitan inscritos con su ticket y estado.
- **US5** Mi espacio muestra las dos secciones con el motivo de cada tarjeta y permite cancelar.
- **Accesibilidad**: axe sin violaciones serias en la página pública con inscripción, el diálogo Compartir y la sección Inscripción.

## Fuera de alcance

Pagos reales, correo de confirmación, preguntas propias, varios boletos por compra (deuda técnica `docs/redesign.md` §10).
