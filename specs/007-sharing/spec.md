# Feature Specification: Compartir eventos y cursos (UI)

**Feature Branch**: `ccr-76a49388-8zpdqw`

**Created**: 2026-10-24

**Status**: Implemented

**Input**: Fase 007 del rediseño ([`docs/redesign.md`](../../docs/redesign.md) §7). Contrato y reglas en la spec del API: `ovejafiel-api/specs/007-sharing/`. Depende de la 005 (correo) y la 006 (páginas públicas).

## User Scenarios & Testing

### US1 — Diálogo «Compartir» (P1)

En el detalle de un evento o curso, quien tiene `events.write` ve el botón **Compartir** (para una serie recurrente comparte la serie). El diálogo, como el de Drive:

1. **Personas con acceso**: correo + rol (Lector o Editor) y «Compartir»; la lista con «Quitar». Se avisa por correo; si no se pudo enviar, se dice y se sugiere copiar el enlace.
2. **Acceso general**: Restringido, Toda la iglesia o Cualquiera con el enlace, con su explicación; y, si no es restringido, el rol del enlace (Puede ver o, solo en cursos, Puede ver e inscribirse), con una frase que resume quién abre qué.
3. **Enlace**: se muestra (`/e/{slug}`) con «Copiar enlace»; «Crear un enlace nuevo» deja sin efecto el anterior.
4. En un curso, la pestaña **Inscritos (N)** lista a quienes se inscribieron (nombre, correo, teléfono) y permite quitar una inscripción.

Un rechazo de la API (por ejemplo, 400) se muestra y el diálogo conserva lo escrito.

### US2 — Página del enlace `/e/{slug}` (P1)

Pública. Muestra tipo (evento o curso), lugar de la iglesia, título, cuándo (en palabras, también para eventos recurrentes), dirección y descripción. Si el enlace lo permite, el formulario **Inscribirme** (nombre, apellido, correo y teléfono opcional; con los datos de la sesión si la hay). Repetir el correo avisa que ya estaba inscrito. Un enlace que no se puede abrir responde «No encontrado» y, sin sesión, ofrece iniciar sesión.

### US3 — Compartidos contigo (P2)

En `/portal`, quien tiene eventos compartidos con su correo verificado ve «Compartidos contigo», con enlace a cada uno.

## Requirements

- **FR-001**: Todo botón que llama a la API muestra spinner y se bloquea mientras dura la petición.
- **FR-002**: La UI solo oculta «Compartir» según `events.write`; la API es la autoridad.
- **FR-003**: Las páginas nuevas cumplen WCAG AA (axe).

## Assumptions

- «Editar» un evento aún no existe en el API: el rol Editor se guarda pero todavía no habilita nada visible.
- Las inscripciones no se vuelven personas de la iglesia (deuda 17).
