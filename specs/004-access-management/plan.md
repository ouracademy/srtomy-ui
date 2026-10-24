# Implementation Plan: Accesos y roles personalizados (UI)

## Summary

Accesos y roles viven como pestañas de la pantalla "Cargos y accesos" (`app/portal/[nodeId]/positions/`), sin ítem de menú propio; las pestañas piden `iam.read`. Sin dependencias nuevas.

## Decisiones

- `pnpm api:sync` trae los endpoints `organizations/{id}/access`, `organizations/{id}/roles`, `roles/{id}` e `iam/permissions` (tag `iam`).
- Patrón de `positions/`: `page.tsx` lee con los hooks generados y escribe con las funciones generadas; un componente puro (`AccessManager`, `RolesManager`) recibe datos y callbacks, y se prueba con user-event.
- `apiErrorMessage` muestra el `detail` en español de las respuestas 400/403 de la API.
- "Crear a partir de" se resuelve en la UI copiando los permisos del rol predefinido; el API solo recibe la lista de permisos.
- Los roles son de la iglesia: la página de roles resuelve la iglesia del nodo (`churchOf`) para comprobar `iam.manage`.

## Estructura

```text
app/portal/[nodeId]/positions/page.tsx   pantalla "Cargos y accesos" con pestañas Cargos, Accesos y Roles
app/portal/[nodeId]/positions/{Access,Roles,Positions}Section.tsx
app/portal/[nodeId]/positions/{AccessManager,RolesManager,RoleDialog,permissionLabels,rolePermissions,apiErrorMessage}.tsx|ts (+ tests)
app/portal/[nodeId]/layout.tsx   ítem "Cargos y accesos" (las pestañas Accesos y Roles piden iam.read)
tests/access.spec.ts             e2e con la API simulada
```
