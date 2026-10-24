# Implementation Plan: Accesos y roles personalizados (UI)

## Summary

Dos pantallas nuevas bajo `app/portal/[nodeId]/access/` y un ítem de menú con `needs: "iam.read"`. Sin dependencias nuevas.

## Decisiones

- `pnpm api:sync` trae los endpoints `organizations/{id}/access`, `organizations/{id}/roles`, `roles/{id}` e `iam/permissions` (tag `iam`).
- Patrón de `positions/`: `page.tsx` lee con los hooks generados y escribe con las funciones generadas; un componente puro (`AccessManager`, `RolesManager`) recibe datos y callbacks, y se prueba con user-event.
- `apiErrorMessage` muestra el `detail` en español de las respuestas 400/403 de la API.
- "Crear a partir de" se resuelve en la UI copiando los permisos del rol predefinido; el API solo recibe la lista de permisos.
- Los roles son de la iglesia: la página de roles resuelve la iglesia del nodo (`churchOf`) para comprobar `iam.manage`.

## Estructura

```text
app/portal/[nodeId]/access/{page,AccessManager,permissionLabels,apiErrorMessage}.tsx|ts (+ tests)
app/portal/[nodeId]/access/roles/{page,RolesManager,RoleDialog,rolePermissions}.tsx|ts (+ tests)
app/portal/[nodeId]/layout.tsx   ítem "Accesos"
tests/access.spec.ts             e2e con la API simulada
```
