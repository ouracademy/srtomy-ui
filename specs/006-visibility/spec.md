# Feature Specification: Visibilidad (UI)

**Feature Branch**: `ccr-76a49388-8zpdqw`

**Created**: 2026-10-24

**Status**: Implemented

**Input**: Fase 006 del rediseño ([`docs/redesign.md`](../../docs/redesign.md) §6). Contrato y reglas en la spec del API: `srtomy-api/specs/006-visibility/`. Depende de la 005.

## User Scenarios & Testing

### US1 — Elegir horario y visibilidad (P1)

Los formularios de iglesia, sede, grupo y ministerio tienen la sección plegable **Horario y visibilidad**: horario de reunión, «¿Quién ve la lista de personas?» (cualquiera con el enlace, toda la iglesia, solo los miembros, solo líderes) con una explicación de cada opción, y —solo en iglesia y sede— si la página pública muestra el organigrama. Si el nodo es público muestra su enlace `/g/{slug}` con «Copiar enlace».

1. **Given** un nodo nuevo, **Then** nace público y con organigrama.
2. **Given** un cambio de visibilidad, **When** se guarda, **Then** la petición lleva `schedule`, `memberVisibility` y `showOrgChart`.
3. **Given** un usuario sin `org.update`, **Then** no ve «Guardar».

### US2 — Directorio de la iglesia (P1)

«Directorio» en el menú de cualquier nodo: todas las sedes, grupos y ministerios de la iglesia, con tipo, descripción, horario y líderes, sangrados por nivel. Al abrir uno se ven sus personas, o un aviso si su visibilidad no se las muestra al usuario.

### US3 — Página pública (P1)

`/g/{slug}` (sin sesión): grupo o ministerio con líderes y miembros; iglesia o sede con dirección, teléfono, cargos y organigrama cuyos nodos públicos enlazan a su página. Un nodo no público responde «No encontrado».

## Requirements

- **FR-001**: La UI no calcula la visibilidad: muestra lo que el API devuelve. La lista oculta no se pide ni se pinta.
- **FR-002**: Las páginas públicas y de invitación cumplen WCAG AA (probado con axe); los botones llenos usan `primaryButtonSx`.
- **FR-003**: Los enlaces a redes sociales abren con `rel="noopener noreferrer"`.
